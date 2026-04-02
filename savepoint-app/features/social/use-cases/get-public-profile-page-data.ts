"use server";

import {
  ProfileService,
  SocialService,
  type PublicProfile,
} from "@/data-access-layer/services";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.USE_CASE]: "getPublicProfilePageData",
});

export type PublicProfilePageData = PublicProfile & {
  followersCount: number;
  followingCount: number;
};

type GetPublicProfilePageDataParams = {
  username: string;
  viewerUserId?: string | null;
};

type GetPublicProfilePageDataResult =
  | {
      success: true;
      data: {
        profile: PublicProfilePageData;
        isOwnProfile: boolean;
        isAuthenticated: boolean;
        isFollowing?: boolean;
      };
    }
  | { success: true; data: { profile: null } }
  | { success: false; error: string };

export async function getPublicProfilePageData(
  params: GetPublicProfilePageDataParams
): Promise<GetPublicProfilePageDataResult> {
  try {
    const profileService = new ProfileService();
    const socialService = new SocialService();

    const profileResult = await profileService.getPublicProfile(
      params.username
    );

    if (!profileResult.success) {
      return { success: false, error: profileResult.error };
    }

    if (!profileResult.data.profile) {
      return { success: true, data: { profile: null } };
    }

    const { profile } = profileResult.data;

    const followCountsResult = await socialService.getFollowCounts(profile.id);

    if (!followCountsResult.success) {
      logger.error(
        { username: params.username },
        "Failed to fetch follow counts"
      );
      return { success: false, error: "Failed to load profile data" };
    }

    const fullProfile: PublicProfilePageData = {
      ...profile,
      followersCount: followCountsResult.data.followers,
      followingCount: followCountsResult.data.following,
    };

    const isAuthenticated =
      params.viewerUserId !== null && params.viewerUserId !== undefined;
    const isOwnProfile = params.viewerUserId === profile.id;

    let isFollowing: boolean | undefined;
    if (isAuthenticated && !isOwnProfile) {
      const followResult = await socialService.isFollowing(
        params.viewerUserId!,
        profile.id
      );
      if (followResult.success) {
        isFollowing = followResult.data;
      }
    }

    return {
      success: true,
      data: {
        profile: fullProfile,
        isOwnProfile,
        isAuthenticated,
        isFollowing,
      },
    };
  } catch (error) {
    logger.error(
      { error, username: params.username },
      "Use case failed: getPublicProfilePageData"
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
