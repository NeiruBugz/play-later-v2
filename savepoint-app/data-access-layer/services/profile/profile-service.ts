import "server-only";

import {
  findUserById,
  getLibraryStatsByUserId,
} from "@/data-access-layer/repository";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  GetProfileInput,
  GetProfileResult,
  GetProfileWithStatsInput,
  GetProfileWithStatsResult,
} from "./types";

export class ProfileService extends BaseService {
  async getProfile(input: GetProfileInput): Promise<GetProfileResult> {
    try {
      const user = await findUserById(input.userId, {
        select: {
          username: true,
          image: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      if (!user) {
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      return this.success({
        profile: {
          username: user.username,
          image: user.image,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      return this.handleError(error, "Failed to fetch profile");
    }
  }

  async getProfileWithStats(
    input: GetProfileWithStatsInput
  ): Promise<GetProfileWithStatsResult> {
    try {
      const [user, statsResult] = await Promise.all([
        findUserById(input.userId, {
          select: {
            username: true,
            image: true,
            email: true,
            name: true,
            createdAt: true,
          },
        }),
        getLibraryStatsByUserId(input.userId),
      ]);

      if (!user) {
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      if (!statsResult.ok) {
        return this.error(
          "Failed to load library stats",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      return this.success({
        profile: {
          username: user.username,
          image: user.image,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          stats: {
            statusCounts: statsResult.data.statusCounts,
            recentGames: statsResult.data.recentGames,
          },
        },
      });
    } catch (error) {
      return this.handleError(error, "Failed to fetch profile with stats");
    }
  }
}
