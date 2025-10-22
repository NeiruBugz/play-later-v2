import "server-only";

import {
  findUserById,
  findUserByNormalizedUsername,
  getLibraryStatsByUserId,
} from "@/data-access-layer/repository";

import { createLogger } from "@/shared/lib";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  CheckUsernameAvailabilityInput,
  CheckUsernameAvailabilityResult,
  GetProfileInput,
  GetProfileResult,
  GetProfileWithStatsInput,
  GetProfileWithStatsResult,
} from "./types";

export class ProfileService extends BaseService {
  private logger = createLogger({ service: "ProfileService" });
  async getProfile(input: GetProfileInput): Promise<GetProfileResult> {
    try {
      this.logger.info({ userId: input.userId }, "Fetching user profile");

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
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      this.logger.info(
        { userId: input.userId, username: user.username },
        "User profile fetched successfully"
      );

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
      this.logger.error(
        { error, userId: input.userId },
        "Error fetching profile"
      );
      return this.handleError(error, "Failed to fetch profile");
    }
  }

  async getProfileWithStats(
    input: GetProfileWithStatsInput
  ): Promise<GetProfileWithStatsResult> {
    try {
      this.logger.info(
        { userId: input.userId },
        "Fetching user profile with stats"
      );

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
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      if (!statsResult.ok) {
        this.logger.error(
          { userId: input.userId, error: statsResult.error },
          "Failed to load library stats"
        );
        return this.error(
          "Failed to load library stats",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      this.logger.info(
        {
          userId: input.userId,
          username: user.username,
          totalGames: statsResult.data.recentGames.length,
        },
        "User profile with stats fetched successfully"
      );

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
      this.logger.error(
        { error, userId: input.userId },
        "Error fetching profile with stats"
      );
      return this.handleError(error, "Failed to fetch profile with stats");
    }
  }

  async checkUsernameAvailability(
    input: CheckUsernameAvailabilityInput
  ): Promise<CheckUsernameAvailabilityResult> {
    try {
      this.logger.info(
        { username: input.username },
        "Checking username availability"
      );

      const normalized = input.username.toLowerCase();
      const existingUser = await findUserByNormalizedUsername(normalized);

      const available = !existingUser;

      this.logger.info(
        { username: input.username, available },
        "Username availability check completed"
      );

      return this.success({
        available,
      });
    } catch (error) {
      this.logger.error(
        { error, username: input.username },
        "Error checking username availability"
      );
      return this.handleError(error, "Failed to check username availability");
    }
  }
}
