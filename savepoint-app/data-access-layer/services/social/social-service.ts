import "server-only";

import {
  countFollowers,
  countFollowing,
  createFollow,
  deleteFollow,
  DuplicateError,
  findFollowers,
  findFollowing,
  findUserById,
  isFollowing,
} from "@/data-access-layer/repository";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import {
  handleServiceError,
  serviceError,
  ServiceErrorCode,
  serviceSuccess,
} from "../types";
import type {
  FollowUserResult,
  GetFollowCountsResult,
  GetFollowersResult,
  GetFollowingResult,
  IsFollowingResult,
  UnfollowUserResult,
} from "./types";

const DEFAULT_PAGE_SIZE = 20;

export class SocialService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "SocialService" });

  async followUser(
    followerId: string,
    followingId: string
  ): Promise<FollowUserResult> {
    try {
      if (followerId === followingId) {
        this.logger.warn({ followerId }, "Self-follow attempt");
        return serviceError(
          "You cannot follow yourself",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const targetUser = await findUserById(followingId, {
        select: { id: true, isPublicProfile: true },
      });

      if (!targetUser) {
        this.logger.warn({ followingId }, "Follow target user not found");
        return serviceError("User not found", ServiceErrorCode.NOT_FOUND);
      }

      if (!targetUser.isPublicProfile) {
        this.logger.warn(
          { followerId, followingId },
          "Follow attempt on non-public profile"
        );
        return serviceError(
          "Cannot follow a private profile",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      try {
        await createFollow(followerId, followingId);
      } catch (error) {
        if (error instanceof DuplicateError) {
          this.logger.warn(
            { followerId, followingId },
            "Duplicate follow attempt"
          );
          return serviceError(
            "Already following this user",
            ServiceErrorCode.CONFLICT
          );
        }
        throw error;
      }

      return serviceSuccess(undefined);
    } catch (error) {
      return handleServiceError(error, "Failed to follow user");
    }
  }

  async unfollowUser(
    followerId: string,
    followingId: string
  ): Promise<UnfollowUserResult> {
    try {
      await deleteFollow(followerId, followingId);
      return serviceSuccess(undefined);
    } catch (error) {
      return handleServiceError(error, "Failed to unfollow user");
    }
  }

  async isFollowing(
    followerId: string,
    followingId: string
  ): Promise<IsFollowingResult> {
    try {
      const following = await isFollowing(followerId, followingId);
      return serviceSuccess(following);
    } catch (error) {
      return handleServiceError(error, "Failed to check follow status");
    }
  }

  async getFollowCounts(userId: string): Promise<GetFollowCountsResult> {
    try {
      const [followers, following] = await Promise.all([
        countFollowers(userId),
        countFollowing(userId),
      ]);
      return serviceSuccess({ followers, following });
    } catch (error) {
      return handleServiceError(error, "Failed to get follow counts");
    }
  }

  async getFollowers(
    userId: string,
    page?: number
  ): Promise<GetFollowersResult> {
    try {
      const user = await findUserById(userId, {
        select: { id: true, isPublicProfile: true },
      });

      if (!user || !user.isPublicProfile) {
        this.logger.warn({ userId }, "getFollowers called for non-public user");
        return serviceError(
          "User not found or profile is private",
          ServiceErrorCode.NOT_FOUND
        );
      }

      const currentPage = page ?? 1;
      const skip = (currentPage - 1) * DEFAULT_PAGE_SIZE;

      const result = await findFollowers(userId, {
        skip,
        take: DEFAULT_PAGE_SIZE,
      });

      return serviceSuccess(result);
    } catch (error) {
      return handleServiceError(error, "Failed to get followers");
    }
  }

  async getFollowing(
    userId: string,
    page?: number
  ): Promise<GetFollowingResult> {
    try {
      const user = await findUserById(userId, {
        select: { id: true, isPublicProfile: true },
      });

      if (!user || !user.isPublicProfile) {
        this.logger.warn({ userId }, "getFollowing called for non-public user");
        return serviceError(
          "User not found or profile is private",
          ServiceErrorCode.NOT_FOUND
        );
      }

      const currentPage = page ?? 1;
      const skip = (currentPage - 1) * DEFAULT_PAGE_SIZE;

      const result = await findFollowing(userId, {
        skip,
        take: DEFAULT_PAGE_SIZE,
      });

      return serviceSuccess(result);
    } catch (error) {
      return handleServiceError(error, "Failed to get following");
    }
  }
}
