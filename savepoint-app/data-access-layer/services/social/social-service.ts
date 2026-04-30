import "server-only";

import {
  countFollowers,
  countFollowing,
  createFollow,
  deleteFollow,
  findFollowers,
  findFollowing,
  findUserById,
  isFollowing,
} from "@/data-access-layer/repository";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/shared/lib/errors";

import type {
  FollowCounts,
  PaginatedFollowersResult,
  PaginatedFollowingResult,
} from "./types";

const DEFAULT_PAGE_SIZE = 20;

export class SocialService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "SocialService" });

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      this.logger.warn({ followerId }, "Self-follow attempt");
      throw new ConflictError("You cannot follow yourself", { followerId });
    }

    const targetUser = await findUserById(followingId, {
      select: { id: true, isPublicProfile: true },
    });

    if (!targetUser) {
      this.logger.warn({ followingId }, "Follow target user not found");
      throw new NotFoundError("User not found");
    }

    if (!targetUser.isPublicProfile) {
      this.logger.warn(
        { followerId, followingId },
        "Follow attempt on non-public profile"
      );
      throw new UnauthorizedError("Cannot follow a private profile", {
        followerId,
        followingId,
      });
    }

    await createFollow(followerId, followingId);
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await deleteFollow(followerId, followingId);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return isFollowing(followerId, followingId);
  }

  async getFollowCounts(userId: string): Promise<FollowCounts> {
    const [followers, following] = await Promise.all([
      countFollowers(userId),
      countFollowing(userId),
    ]);
    return { followers, following };
  }

  async getFollowers(
    userId: string,
    page?: number
  ): Promise<PaginatedFollowersResult> {
    const user = await findUserById(userId, {
      select: { id: true, isPublicProfile: true },
    });

    if (!user || !user.isPublicProfile) {
      this.logger.warn({ userId }, "getFollowers called for non-public user");
      throw new NotFoundError("User not found or profile is private");
    }

    const currentPage = page ?? 1;
    const skip = (currentPage - 1) * DEFAULT_PAGE_SIZE;

    return findFollowers(userId, { skip, take: DEFAULT_PAGE_SIZE });
  }

  async getFollowing(
    userId: string,
    page?: number
  ): Promise<PaginatedFollowingResult> {
    const user = await findUserById(userId, {
      select: { id: true, isPublicProfile: true },
    });

    if (!user || !user.isPublicProfile) {
      this.logger.warn({ userId }, "getFollowing called for non-public user");
      throw new NotFoundError("User not found or profile is private");
    }

    const currentPage = page ?? 1;
    const skip = (currentPage - 1) * DEFAULT_PAGE_SIZE;

    return findFollowing(userId, { skip, take: DEFAULT_PAGE_SIZE });
  }
}
