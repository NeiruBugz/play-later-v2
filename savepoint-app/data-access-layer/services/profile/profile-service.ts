import "server-only";

import {
  findUserById,
  findUserByNormalizedUsername,
  getLibraryStatsByUserId,
  getUserSteamData,
  updateUserProfile,
} from "@/data-access-layer/repository";

import { validateUsername } from "@/features/profile/lib";
import {
  NEW_USER_THRESHOLD_MS,
  SUGGESTED_USERNAME_MAX_LENGTH,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import {
  handleServiceError,
  serviceError,
  ServiceErrorCode,
  serviceSuccess,
} from "../types";
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
  GetSteamConnectionStatusInput,
  GetSteamConnectionStatusResult,
  UpdateAvatarUrlInput,
  UpdateAvatarUrlResult,
  UpdateProfileInput,
  UpdateProfileResult,
} from "./types";

export class ProfileService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "ProfileService" });
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
        this.logger.warn({ userId: input.userId }, "User not found");
        return serviceError("User not found", ServiceErrorCode.NOT_FOUND);
      }
      const profile = mapUserToProfile(user);
      return serviceSuccess({ profile });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error fetching profile"
      );
      return handleServiceError(error, "Failed to fetch profile");
    }
  }
  async getProfileWithStats(
    input: GetProfileWithStatsInput
  ): Promise<GetProfileWithStatsResult> {
    try {
      const [user, stats] = await Promise.all([
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
        return serviceError("User not found", ServiceErrorCode.NOT_FOUND);
      }
      const profile = mapUserToProfileWithStats(user, stats);
      return serviceSuccess({ profile });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error fetching profile with stats"
      );
      return handleServiceError(error, "Failed to fetch profile with stats");
    }
  }
  async checkUsernameAvailability(
    input: CheckUsernameAvailabilityInput
  ): Promise<CheckUsernameAvailabilityResult> {
    try {
      const normalized = input.username.toLowerCase();
      const existingUser = await findUserByNormalizedUsername(normalized);
      const available = !existingUser;
      return serviceSuccess({
        available,
      });
    } catch (error) {
      this.logger.error(
        { error, username: input.username },
        "Error checking username availability"
      );
      return handleServiceError(error, "Failed to check username availability");
    }
  }
  async updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
    try {
      const validation = validateUsername(input.username);
      if (!validation.valid) {
        this.logger.warn(
          { userId: input.userId, username: input.username },
          "Invalid username"
        );
        return serviceError(
          validation.error,
          ServiceErrorCode.VALIDATION_ERROR
        );
      }
      const currentUser = await findUserById(input.userId, {
        select: { username: true },
      });
      if (!currentUser) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return serviceError("User not found", ServiceErrorCode.NOT_FOUND);
      }
      if (currentUser.username !== input.username) {
        const availabilityResult = await this.checkUsernameAvailability({
          username: input.username,
        });
        if (!availabilityResult.success || !availabilityResult.data.available) {
          this.logger.warn(
            { userId: input.userId, username: input.username },
            "Username already taken"
          );
          return serviceError(
            "Username already exists",
            ServiceErrorCode.CONFLICT
          );
        }
      }
      const updatedUser = await updateUserProfile(input.userId, {
        username: input.username,
        usernameNormalized: input.username.toLowerCase(),
        image: input.avatarUrl,
      });
      return serviceSuccess({
        username: updatedUser.username,
        image: updatedUser.image,
      });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error updating profile"
      );
      return handleServiceError(error, "Failed to update profile");
    }
  }
  async updateAvatarUrl(
    input: UpdateAvatarUrlInput
  ): Promise<UpdateAvatarUrlResult> {
    try {
      const user = await findUserById(input.userId, {
        select: { id: true },
      });
      if (!user) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return serviceError("User not found", ServiceErrorCode.NOT_FOUND);
      }
      await updateUserProfile(input.userId, {
        image: input.avatarUrl,
      });
      return serviceSuccess(undefined);
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error updating avatar URL"
      );
      return handleServiceError(error, "Failed to update avatar URL");
    }
  }
  async checkSetupStatus(
    input: CheckSetupStatusInput
  ): Promise<CheckSetupStatusResult> {
    try {
      const user = await findUserById(input.userId, {
        select: {
          username: true,
          name: true,
          profileSetupCompletedAt: true,
          createdAt: true,
        },
      });
      if (!user) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return serviceError("User not found", ServiceErrorCode.NOT_FOUND);
      }
      if (user.profileSetupCompletedAt) {
        return serviceSuccess({
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
      return serviceSuccess({
        needsSetup,
        suggestedUsername,
      });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error checking setup status"
      );
      return handleServiceError(error, "Failed to check setup status");
    }
  }
  async completeSetup(input: CompleteSetupInput): Promise<CompleteSetupResult> {
    try {
      if (input.username) {
        const validation = validateUsername(input.username);
        if (!validation.valid) {
          this.logger.warn(
            { userId: input.userId, username: input.username },
            "Invalid username"
          );
          return serviceError(
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
          return serviceError(
            "Username already exists",
            ServiceErrorCode.CONFLICT
          );
        }
      }
      const updatedUser = await updateUserProfile(input.userId, {
        username: input.username,
        usernameNormalized: input.username?.toLowerCase(),
        image: input.avatarUrl,
        profileSetupCompletedAt: new Date(),
      });
      return serviceSuccess({
        username: updatedUser.username,
        image: updatedUser.image,
      });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error completing profile setup"
      );
      return handleServiceError(error, "Failed to complete setup");
    }
  }
  async getRedirectAfterAuth(input: {
    userId: string;
  }): Promise<import("./types").GetRedirectAfterAuthResult> {
    try {
      const status = await this.checkSetupStatus({ userId: input.userId });
      if (!status.success) {
        return serviceSuccess({ redirectTo: "/dashboard", isNewUser: false });
      }
      const isNewUser = status.data.needsSetup;
      const redirectTo = isNewUser ? "/profile/setup" : "/dashboard";
      return serviceSuccess({ redirectTo, isNewUser });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error determining post-auth redirect"
      );
      return handleServiceError(
        error,
        "Failed to determine post-auth redirect"
      );
    }
  }
  async verifyUserExists(input: { userId: string }) {
    try {
      const user = await findUserById(input.userId, {
        select: { id: true },
      });
      if (!user) {
        this.logger.warn({ userId: input.userId }, "User not found");
        return serviceError(
          "User account not found",
          ServiceErrorCode.NOT_FOUND
        );
      }
      return serviceSuccess(undefined);
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error verifying user existence"
      );
      return handleServiceError(error, "Failed to verify user account");
    }
  }
  async getSteamConnectionStatus(
    input: GetSteamConnectionStatusInput
  ): Promise<GetSteamConnectionStatusResult> {
    try {
      const steamData = await getUserSteamData({ userId: input.userId });
      if (!steamData || !steamData.steamId64 || !steamData.steamUsername) {
        return serviceSuccess({ connected: false });
      }
      return serviceSuccess({
        connected: true,
        profile: {
          steamId64: steamData.steamId64,
          displayName: steamData.steamUsername,
          avatarUrl: steamData.steamAvatar || "",
          profileUrl: steamData.steamProfileURL || "",
        },
      });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId },
        "Error fetching Steam connection status"
      );
      return handleServiceError(
        error,
        "Failed to fetch Steam connection status"
      );
    }
  }
}
