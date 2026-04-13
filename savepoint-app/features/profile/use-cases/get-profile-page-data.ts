import "server-only";

import { ProfileService, SocialService } from "@/data-access-layer/services";
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
  email?: string | null;
};

type LibraryStats = {
  statusCounts: Record<string, number>;
  recentGames: Array<{
    gameId: string;
    title: string;
    coverImage: string | null;
    lastPlayed: Date;
  }>;
  journalCount: number;
};

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
      email: string | null;
      createdAt: Date;
      isPublicProfile: boolean;
      stats: LibraryStats;
      libraryPreview: LibraryPreviewGame[];
    } | null = null;

    if (viewerId) {
      const statsResult = await profileService.getProfileWithStats({
        userId: viewerId,
      });
      if (statsResult && !statsResult.success) {
        return { success: false, error: statsResult.error };
      }
      const statsProfile = statsResult?.success
        ? (statsResult.data.profile as unknown as {
            username: string;
            name: string | null;
            image: string | null;
            email: string | null;
            createdAt: Date;
            isPublicProfile: boolean;
            stats: LibraryStats;
            libraryPreview: LibraryPreviewGame[];
          })
        : null;

      if (statsProfile && statsProfile.username === username) {
        ownerProfileRaw = { ...statsProfile, id: viewerId };
      }
    }

    if (ownerProfileRaw) {
      const followCountsResult = await socialService.getFollowCounts(
        ownerProfileRaw.id
      );
      if (!followCountsResult.success) {
        return { success: false, error: followCountsResult.error };
      }

      const ownerGameCount = Object.values(
        ownerProfileRaw.stats.statusCounts
      ).reduce((total, count) => total + count, 0);

      return {
        success: true,
        data: {
          profile: {
            id: ownerProfileRaw.id,
            username: ownerProfileRaw.username,
            name: ownerProfileRaw.name,
            image: ownerProfileRaw.image,
            email: ownerProfileRaw.email,
            createdAt: ownerProfileRaw.createdAt,
            isPublicProfile: ownerProfileRaw.isPublicProfile,
          },
          stats: ownerProfileRaw.stats,
          libraryPreview: ownerProfileRaw.libraryPreview,
          gameCount: ownerGameCount,
          socialCounts: followCountsResult.data,
          viewer: {
            isOwner: true,
            isAuthenticated: true,
          },
          isPrivate: false,
        },
      };
    }

    const publicResult = await profileService.getPublicProfile(username);
    if (!publicResult.success) {
      return { success: false, error: publicResult.error };
    }
    if (!publicResult.data.profile) {
      return {
        success: true,
        data: {
          profile: null as unknown as ProfileResponse,
          gameCount: 0,
          socialCounts: { followers: 0, following: 0 },
          viewer: { isOwner: false, isAuthenticated: Boolean(viewerId) },
          isPrivate: false,
        },
      };
    }

    const pub = publicResult.data.profile as unknown as {
      id: string;
      username: string;
      name: string | null;
      image: string | null;
      gameCount: number;
      libraryPreview: LibraryPreviewGame[];
      isPublicProfile: boolean;
      createdAt: Date;
    };

    const isAuthenticated = viewerId !== undefined && viewerId !== null;
    const isOwner = false;
    const isPrivate = pub.isPublicProfile === false && !isOwner;

    const followCountsResult = await socialService.getFollowCounts(pub.id);
    if (!followCountsResult.success) {
      return { success: false, error: followCountsResult.error };
    }

    const viewer: Viewer = {
      isOwner,
      isAuthenticated,
    };

    if (isAuthenticated && !isOwner && !isPrivate) {
      const followResult = await socialService.isFollowing(viewerId!, pub.id);
      if (followResult.success) {
        viewer.isFollowing = followResult.data;
      }
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
      socialCounts: followCountsResult.data,
      viewer,
      isPrivate,
    };

    if (!isPrivate) {
      data.libraryPreview = pub.libraryPreview;

      const visitorStatsResult = await profileService.getProfileWithStats({
        userId: pub.id,
      });
      if (!visitorStatsResult.success) {
        return { success: false, error: visitorStatsResult.error };
      }
      const visitorStatsProfile = visitorStatsResult.data
        .profile as unknown as { stats: LibraryStats };
      data.stats = visitorStatsProfile.stats;
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
