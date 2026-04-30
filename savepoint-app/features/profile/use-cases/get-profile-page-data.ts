import "server-only";

import { ProfileService, SocialService } from "@/data-access-layer/services";
import type { RatingHistogramEntry } from "@/data-access-layer/services/profile/types";
import { cache } from "react";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.USE_CASE]: "getProfilePageData",
});

type ProfileResponse = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  isPublicProfile: boolean;
};

export type ProfilePageLibraryStats = {
  statusCounts: Record<string, number>;
  recentGames: Array<{
    gameId: string;
    title: string;
    coverImage: string | null;
    lastPlayed: Date;
  }>;
  journalCount: number;
  ratingHistogram: RatingHistogramEntry[];
  ratedCount: number;
};

type LibraryStats = ProfilePageLibraryStats;

type LibraryPreviewGame = {
  title: string;
  coverImage: string | null;
  slug: string;
};

type SocialCounts = {
  followers: number;
  following: number;
};

type Viewer = {
  isOwner: boolean;
  isAuthenticated: boolean;
  isFollowing?: boolean;
};

export type ProfilePageData = {
  profile: ProfileResponse;
  stats?: LibraryStats;
  libraryPreview?: LibraryPreviewGame[];
  gameCount: number;
  socialCounts: SocialCounts;
  viewer: Viewer;
  isPrivate: boolean;
};

export type GetProfilePageDataResult =
  | { success: true; data: ProfilePageData }
  | { success: false; error: string };

async function getProfilePageDataImpl(
  username: string,
  viewerId?: string
): Promise<GetProfilePageDataResult> {
  try {
    const profileService = new ProfileService();
    const socialService = new SocialService();

    let ownerProfileRaw: {
      id: string;
      username: string;
      name: string | null;
      image: string | null;
      createdAt: Date;
      isPublicProfile: boolean;
      stats: LibraryStats;
      gameCount: number;
      libraryPreview: LibraryPreviewGame[];
    } | null = null;

    if (viewerId) {
      try {
        const statsProfile = await profileService.getProfileWithStats({
          userId: viewerId,
        });

        if (statsProfile.username === username) {
          ownerProfileRaw = {
            id: viewerId,
            username: statsProfile.username,
            name: statsProfile.name,
            image: statsProfile.image,
            createdAt: statsProfile.createdAt,
            isPublicProfile: statsProfile.isPublicProfile,
            stats: {
              ...statsProfile.stats,
              ratingHistogram: statsProfile.ratingHistogram,
              ratedCount: statsProfile.ratedCount,
            },
            gameCount: statsProfile.gameCount,
            libraryPreview: statsProfile.libraryPreview,
          };
        }
      } catch {
        // Viewer profile fetch failed — fall through to public profile path
      }
    }

    if (ownerProfileRaw) {
      const followCounts = await socialService.getFollowCounts(
        ownerProfileRaw.id
      );

      return {
        success: true,
        data: {
          profile: {
            id: ownerProfileRaw.id,
            username: ownerProfileRaw.username,
            name: ownerProfileRaw.name,
            image: ownerProfileRaw.image,
            createdAt: ownerProfileRaw.createdAt,
            isPublicProfile: ownerProfileRaw.isPublicProfile,
          },
          stats: ownerProfileRaw.stats,
          libraryPreview: ownerProfileRaw.libraryPreview,
          gameCount: ownerProfileRaw.gameCount,
          socialCounts: followCounts,
          viewer: {
            isOwner: true,
            isAuthenticated: true,
          },
          isPrivate: false,
        },
      };
    }

    const pub = await profileService.getPublicProfile(username);
    if (!pub) {
      return { success: false, error: "Profile not found" };
    }

    const isAuthenticated = viewerId !== undefined && viewerId !== null;
    const isOwner = false;
    const isPrivate = pub.isPublicProfile === false && !isOwner;

    const followCounts = await socialService.getFollowCounts(pub.id);

    const viewer: Viewer = {
      isOwner,
      isAuthenticated,
    };

    if (isAuthenticated && !isOwner && !isPrivate) {
      const following = await socialService.isFollowing(viewerId!, pub.id);
      viewer.isFollowing = following;
    }

    const data: ProfilePageData = {
      profile: {
        id: pub.id,
        username: pub.username,
        name: pub.name,
        image: pub.image,
        createdAt: pub.createdAt,
        isPublicProfile: pub.isPublicProfile,
      },
      gameCount: isPrivate ? 0 : pub.gameCount,
      socialCounts: followCounts,
      viewer,
      isPrivate,
    };

    if (!isPrivate) {
      data.libraryPreview = pub.libraryPreview;

      const visitorStats = await profileService.getProfileWithStats({
        userId: pub.id,
      });
      data.stats = {
        ...visitorStats.stats,
        ratingHistogram: visitorStats.ratingHistogram,
        ratedCount: visitorStats.ratedCount,
      };
    }

    return { success: true, data };
  } catch (error) {
    logger.error({ error, username }, "Use case failed: getProfilePageData");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const getProfilePageData = cache(getProfilePageDataImpl);
