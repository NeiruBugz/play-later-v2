import "server-only";
import {
  findUserById,
  findUserByNormalizedUsername,
  getLibraryStatsByUserId,
  updateUserProfile,
} from "@/data-access-layer/repository";
import { validateUsername } from "@/features/profile/lib/validation";
import {
  NEW_USER_THRESHOLD_MS,
  SUGGESTED_USERNAME_MAX_LENGTH,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { BaseService, ServiceErrorCode } from "../types";
import { mapUserToProfile, mapUserToProfileWithStats } from "./mappers";
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
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "ProfileService" });
  async getProfile(input: GetProfileInput): Promise<GetProfileResult> {
    try {
      this.logger.info({ userId: input.userId }, "Fetching user profile");
      const userResult = await findUserById(input.userId, {
        select: {
          username: true,
          image: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
      if (!userResult.ok) {
        this.logger.error(
          { userId: input.userId, error: userResult.error },
          "Error fetching user by ID"
        );
        return this.error(
          "Failed to fetch user profile",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      if (!userResult.data) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }
      const user = userResult.data;
      this.logger.info(
        { userId: input.userId, username: user.username },
        "User profile fetched successfully"
      );
      const profile = mapUserToProfile(user);
      return this.success({ profile });
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
      const [userResult, statsResult] = await Promise.all([
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
      if (!userResult.ok) {
        this.logger.error(
          { userId: input.userId, error: userResult.error },
          "Error fetching user by ID"
        );
        return this.error(
          "Failed to fetch user profile",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      if (!userResult.data) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }
      if (!statsResult.ok) {
        this.logger.error(
          { userId: input.userId, error: statsResult.error },
          "Failed to load library stats"
        );
        return this.error(
          statsResult.error.message,
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      const user = userResult.data;
      this.logger.info(
        {
          userId: input.userId,
          username: user.username,
          totalGames: statsResult.data.recentGames.length,
        },
        "User profile with stats fetched successfully"
      );
      const profile = mapUserToProfileWithStats(user, statsResult.data);
      return this.success({ profile });
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
      const existingUserResult = await findUserByNormalizedUsername(normalized);
      if (!existingUserResult.ok) {
        this.logger.error(
          { username: input.username, error: existingUserResult.error },
          "Error checking username availability"
        );
        return this.error(
          "Failed to check username availability",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      const available = !existingUserResult.data;
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
      const validation = validateUsername(input.username);
      if (!validation.valid) {
        this.logger.warn(
          { userId: input.userId, username: input.username },
          "Invalid username"
        );
        return this.error(validation.error, ServiceErrorCode.VALIDATION_ERROR);
      }
      const currentUserResult = await findUserById(input.userId, {
        select: { username: true },
      });
      if (!currentUserResult.ok) {
        this.logger.error(
          { userId: input.userId, error: currentUserResult.error },
          "Error fetching user by ID"
        );
        return this.error(
          "Failed to fetch user data",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      if (!currentUserResult.data) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }
      const currentUser = currentUserResult.data;
      if (currentUser.username !== input.username) {
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
      const userResult = await updateUserProfile(input.userId, {
        username: input.username,
        usernameNormalized: input.username.toLowerCase(),
        image: input.avatarUrl,
      });
      if (!userResult.ok) {
        this.logger.error(
          { userId: input.userId, error: userResult.error },
          "Error updating user profile"
        );
        return this.error(
          "Failed to update profile",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      this.logger.info(
        { userId: input.userId, username: input.username },
        "Profile updated successfully"
      );
      return this.success({
        username: userResult.data.username,
        image: userResult.data.image,
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
      const userResult = await findUserById(input.userId, {
        select: { id: true },
      });
      if (!userResult.ok) {
        this.logger.error(
          { userId: input.userId, error: userResult.error },
          "Error fetching user by ID"
        );
        return this.error(
          "Failed to verify user",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      if (!userResult.data) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }
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
      const userResult = await findUserById(input.userId, {
        select: {
          username: true,
          name: true,
          profileSetupCompletedAt: true,
          createdAt: true,
        },
      });
      if (!userResult.ok) {
        this.logger.error(
          { userId: input.userId, error: userResult.error },
          "Error fetching user by ID"
        );
        return this.error(
          "Failed to check setup status",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      if (!userResult.data) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User not found", ServiceErrorCode.NOT_FOUND);
      }
      const user = userResult.data;
      if (user.profileSetupCompletedAt) {
        return this.success({
          needsSetup: false,
          suggestedUsername: undefined,
        });
      }
      const thresholdTime = new Date(Date.now() - NEW_USER_THRESHOLD_MS);
      const isNewUser = user.createdAt > thresholdTime;
      const needsSetup = !user.username || isNewUser;
      let suggestedUsername: string | undefined;
      if (needsSetup && user.name) {
        suggestedUsername = user.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, SUGGESTED_USERNAME_MAX_LENGTH);
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
      const userResult = await updateUserProfile(input.userId, {
        username: input.username,
        usernameNormalized: input.username?.toLowerCase(),
        image: input.avatarUrl,
        profileSetupCompletedAt: new Date(),
      });
      if (!userResult.ok) {
        this.logger.error(
          { userId: input.userId, error: userResult.error },
          "Error updating user profile"
        );
        return this.error(
          "Failed to complete setup",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      this.logger.info(
        { userId: input.userId, username: input.username },
        "Profile setup completed"
      );
      return this.success({
        username: userResult.data.username,
        image: userResult.data.image,
      });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error completing profile setup"
      );
      return this.handleError(error, "Failed to complete setup");
    }
  }
  async getRedirectAfterAuth(input: {
    userId: string;
  }): Promise<import("./types").GetRedirectAfterAuthResult> {
    try {
      this.logger.info(
        { userId: input.userId },
        "Determining post-auth redirect"
      );
      const status = await this.checkSetupStatus({ userId: input.userId });
      if (!status.success) {
        return this.success({ redirectTo: "/dashboard", isNewUser: false });
      }
      const isNewUser = status.data.needsSetup;
      const redirectTo = isNewUser ? "/profile/setup" : "/dashboard";
      return this.success({ redirectTo, isNewUser });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error determining post-auth redirect"
      );
      return this.handleError(error, "Failed to determine post-auth redirect");
    }
  }
  async verifyUserExists(input: { userId: string }) {
    try {
      this.logger.info({ userId: input.userId }, "Verifying user existence");
      const userResult = await findUserById(input.userId, {
        select: { id: true },
      });
      if (!userResult.ok) {
        this.logger.error(
          { userId: input.userId, error: userResult.error },
          "Error verifying user existence"
        );
        return this.error(
          "Failed to verify user account",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      if (!userResult.data) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return this.error("User account not found", ServiceErrorCode.NOT_FOUND);
      }
      return this.success(undefined);
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error verifying user existence"
      );
      return this.handleError(error, "Failed to verify user account");
    }
  }
}
