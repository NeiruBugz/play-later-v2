import "server-only";

import {
  findUserById,
  findUserByNormalizedUsername,
  getLibraryStatsByUserId,
  updateUserProfile,
} from "@/data-access-layer/repository";

import { validateUsername } from "@/features/profile/lib/validation";
import { createLogger } from "@/shared/lib";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  CheckSetupStatusInput,
  CheckSetupStatusResult,
  CheckUsernameAvailabilityInput,
  CheckUsernameAvailabilityResult,
  CompleteSetupInput,
  CompleteSetupResult,
  GetProfileInput,
  GetProfileResult,
  GetProfileWithStatsInput,
  GetProfileWithStatsResult,
  UpdateAvatarUrlInput,
  UpdateAvatarUrlResult,
  UpdateProfileInput,
  UpdateProfileResult,
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

  async updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
    try {
      this.logger.info({ userId: input.userId }, "Updating profile");

      // Validate username
      const validation = validateUsername(input.username);
      if (!validation.valid) {
        this.logger.warn(
          { userId: input.userId, username: input.username },
          "Invalid username"
        );
        return this.error(validation.error, ServiceErrorCode.VALIDATION_ERROR);
      }

      // Check if username changed
      const currentUser = await findUserById(input.userId, {
        select: { username: true },
      });

      if (!currentUser) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      if (currentUser.username !== input.username) {
        // Username changed - check availability
        const availabilityResult = await this.checkUsernameAvailability({
          username: input.username,
        });
        if (!availabilityResult.success || !availabilityResult.data.available) {
          this.logger.warn(
            { userId: input.userId, username: input.username },
            "Username already taken"
          );
          return this.error(
            "Username already exists",
            ServiceErrorCode.CONFLICT
          );
        }
      }

      // Update via repository
      const user = await updateUserProfile(input.userId, {
        username: input.username,
        usernameNormalized: input.username.toLowerCase(),
        image: input.avatarUrl,
      });

      this.logger.info(
        { userId: input.userId, username: input.username },
        "Profile updated successfully"
      );

      return this.success({
        username: user.username,
        image: user.image,
      });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error updating profile"
      );
      return this.handleError(error, "Failed to update profile");
    }
  }

  async updateAvatarUrl(
    input: UpdateAvatarUrlInput
  ): Promise<UpdateAvatarUrlResult> {
    try {
      this.logger.info({ userId: input.userId }, "Updating avatar URL");

      // Verify user exists
      const user = await findUserById(input.userId, {
        select: { id: true },
      });

      if (!user) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      // Update avatar URL via repository
      await updateUserProfile(input.userId, {
        image: input.avatarUrl,
      });

      this.logger.info(
        { userId: input.userId, avatarUrl: input.avatarUrl },
        "Avatar URL updated successfully"
      );

      return this.success(undefined);
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error updating avatar URL"
      );
      return this.handleError(error, "Failed to update avatar URL");
    }
  }

  async checkSetupStatus(
    input: CheckSetupStatusInput
  ): Promise<CheckSetupStatusResult> {
    try {
      this.logger.info({ userId: input.userId }, "Checking setup status");

      const user = await findUserById(input.userId, {
        select: {
          username: true,
          name: true,
          createdAt: true,
        },
      });

      if (!user) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }

      // Determine if user needs setup
      // Business logic: needs setup if no username OR created within last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isNewUser = user.createdAt > fiveMinutesAgo;
      const needsSetup = !user.username || isNewUser;

      // Generate suggested username from user's name
      let suggestedUsername: string | undefined;
      if (needsSetup && user.name) {
        // Create a simple username from the user's name
        // Remove non-alphanumeric characters and convert to lowercase
        suggestedUsername = user.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 20); // Limit to 20 characters
      }

      this.logger.info(
        { userId: input.userId, needsSetup, hasUsername: !!user.username },
        "Setup status checked"
      );

      return this.success({
        needsSetup,
        suggestedUsername,
      });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error checking setup status"
      );
      return this.handleError(error, "Failed to check setup status");
    }
  }

  async completeSetup(input: CompleteSetupInput): Promise<CompleteSetupResult> {
    try {
      this.logger.info({ userId: input.userId }, "Completing profile setup");

      // Validate username if provided
      if (input.username) {
        const validation = validateUsername(input.username);
        if (!validation.valid) {
          this.logger.warn(
            { userId: input.userId, username: input.username },
            "Invalid username"
          );
          return this.error(
            validation.error,
            ServiceErrorCode.VALIDATION_ERROR
          );
        }

        // Check uniqueness
        const availabilityResult = await this.checkUsernameAvailability({
          username: input.username,
        });
        if (!availabilityResult.success || !availabilityResult.data.available) {
          this.logger.warn(
            { userId: input.userId, username: input.username },
            "Username already taken"
          );
          return this.error(
            "Username already exists",
            ServiceErrorCode.CONFLICT
          );
        }
      }

      // Update user record via repository
      const user = await updateUserProfile(input.userId, {
        username: input.username,
        usernameNormalized: input.username?.toLowerCase(),
        image: input.avatarUrl,
      });

      this.logger.info(
        { userId: input.userId, username: input.username },
        "Profile setup completed"
      );

      return this.success({
        username: user.username,
        image: user.image,
      });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error completing profile setup"
      );
      return this.handleError(error, "Failed to complete setup");
    }
  }
}
