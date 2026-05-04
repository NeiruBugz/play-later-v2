import "server-only";

import {
  countLibraryItemsByUserId,
  findLibraryPreview,
  findUserById,
  findUserByNormalizedUsername,
  findUserByUsername,
  getLibraryStatsByUserId,
  getRatingHistogram,
  getUserSteamData,
  updateUserProfile,
} from "@/data-access-layer/repository";

import { validateUsername } from "@/features/profile/lib";
import {
  NEW_USER_THRESHOLD_MS,
  SUGGESTED_USERNAME_MAX_LENGTH,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { ConflictError, NotFoundError } from "@/shared/lib/errors";

import { mapUserToProfile, mapUserToProfileWithStats } from "./mappers";
import type {
  CheckSetupStatusInput,
  CheckUsernameAvailabilityInput,
  CompleteSetupInput,
  GetProfileInput,
  GetProfileWithStatsInput,
  GetSteamConnectionStatusInput,
  Profile,
  ProfileWithStats,
  PublicProfile,
  SteamConnectionStatus,
  UpdateAvatarUrlInput,
  UpdateProfileInput,
} from "./types";

export class ProfileService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "ProfileService" });

  async getProfile(input: GetProfileInput): Promise<Profile> {
    const user = await findUserById(input.userId, {
      select: {
        username: true,
        image: true,
        email: true,
        name: true,
        createdAt: true,
        isPublicProfile: true,
      },
    });
    if (!user) {
      this.logger.warn({ userId: input.userId }, "User not found");
      throw new NotFoundError("User not found", { userId: input.userId });
    }
    return mapUserToProfile(user);
  }

  async getProfileWithStats(
    input: GetProfileWithStatsInput
  ): Promise<ProfileWithStats> {
    const [user, stats, gameCount, libraryPreview, ratingHistogram] =
      await Promise.all([
        findUserById(input.userId, {
          select: {
            username: true,
            image: true,
            email: true,
            name: true,
            createdAt: true,
            isPublicProfile: true,
          },
        }),
        getLibraryStatsByUserId(input.userId),
        countLibraryItemsByUserId(input.userId),
        findLibraryPreview(input.userId),
        getRatingHistogram({ userId: input.userId }),
      ]);
    if (!user) {
      this.logger.warn({ userId: input.userId }, "User not found");
      throw new NotFoundError("User not found", { userId: input.userId });
    }
    const ratedCount = ratingHistogram.reduce(
      (sum, entry) => sum + entry.count,
      0
    );
    return mapUserToProfileWithStats(
      user,
      stats,
      gameCount,
      libraryPreview.map((item) => item.game),
      ratingHistogram,
      ratedCount
    );
  }

  async getPublicProfile(username: string): Promise<PublicProfile | null> {
    const user = await findUserByUsername(username);

    if (!user) {
      return null;
    }

    if (!user.isPublicProfile) {
      return {
        id: user.id,
        name: user.name,
        username: user.username!,
        image: user.image,
        gameCount: 0,
        libraryPreview: [],
        isPublicProfile: false,
        createdAt: user.createdAt,
      };
    }

    const [gameCount, libraryPreview] = await Promise.all([
      countLibraryItemsByUserId(user.id),
      findLibraryPreview(user.id),
    ]);

    return {
      id: user.id,
      name: user.name,
      username: user.username!,
      image: user.image,
      gameCount,
      libraryPreview: libraryPreview.map((item) => item.game),
      isPublicProfile: true,
      createdAt: user.createdAt,
    };
  }

  async checkUsernameAvailability(
    input: CheckUsernameAvailabilityInput
  ): Promise<boolean> {
    const normalized = input.username.toLowerCase();
    const existingUser = await findUserByNormalizedUsername(normalized);
    return !existingUser;
  }

  async updateProfile(input: UpdateProfileInput): Promise<{
    username: string | null;
    image: string | null;
  }> {
    const validation = validateUsername(input.username);
    if (!validation.valid) {
      this.logger.warn(
        { userId: input.userId, username: input.username },
        "Invalid username"
      );
      throw new Error(validation.error);
    }
    const currentUser = await findUserById(input.userId, {
      select: { username: true },
    });
    if (!currentUser) {
      this.logger.warn({ userId: input.userId }, "User not found");
      throw new NotFoundError("User not found", { userId: input.userId });
    }
    if (currentUser.username !== input.username) {
      const available = await this.checkUsernameAvailability({
        username: input.username,
      });
      if (!available) {
        this.logger.warn(
          { userId: input.userId, username: input.username },
          "Username already taken"
        );
        throw new ConflictError("Username already exists", {
          username: input.username,
        });
      }
    }
    const updatedUser = await updateUserProfile(input.userId, {
      username: input.username,
      usernameNormalized: input.username.toLowerCase(),
      image: input.avatarUrl,
      ...(input.isPublicProfile !== undefined && {
        isPublicProfile: input.isPublicProfile,
      }),
    });
    return {
      username: updatedUser.username,
      image: updatedUser.image,
    };
  }

  async updateAvatarUrl(input: UpdateAvatarUrlInput): Promise<void> {
    const user = await findUserById(input.userId, {
      select: { id: true },
    });
    if (!user) {
      this.logger.warn({ userId: input.userId }, "User not found");
      throw new NotFoundError("User not found", { userId: input.userId });
    }
    await updateUserProfile(input.userId, {
      image: input.avatarUrl,
    });
  }

  async checkSetupStatus(input: CheckSetupStatusInput): Promise<{
    needsSetup: boolean;
    suggestedUsername?: string;
  }> {
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
      throw new NotFoundError("User not found", { userId: input.userId });
    }
    if (user.profileSetupCompletedAt) {
      return {
        needsSetup: false,
        suggestedUsername: undefined,
      };
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
    return {
      needsSetup,
      suggestedUsername,
    };
  }

  async completeSetup(input: CompleteSetupInput): Promise<{
    username: string | null;
    image: string | null;
  }> {
    if (input.username) {
      const validation = validateUsername(input.username);
      if (!validation.valid) {
        this.logger.warn(
          { userId: input.userId, username: input.username },
          "Invalid username"
        );
        throw new Error(validation.error);
      }
      const available = await this.checkUsernameAvailability({
        username: input.username,
      });
      if (!available) {
        this.logger.warn(
          { userId: input.userId, username: input.username },
          "Username already taken"
        );
        throw new ConflictError("Username already exists", {
          username: input.username,
        });
      }
    }
    const updatedUser = await updateUserProfile(input.userId, {
      username: input.username,
      usernameNormalized: input.username?.toLowerCase(),
      image: input.avatarUrl,
      profileSetupCompletedAt: new Date(),
    });
    return {
      username: updatedUser.username,
      image: updatedUser.image,
    };
  }

  async getRedirectAfterAuth(input: {
    userId: string;
  }): Promise<{ redirectTo: string; isNewUser: boolean }> {
    try {
      const status = await this.checkSetupStatus({ userId: input.userId });
      const isNewUser = status.needsSetup;
      const redirectTo = isNewUser ? "/profile/setup" : "/dashboard";
      return { redirectTo, isNewUser };
    } catch {
      return { redirectTo: "/dashboard", isNewUser: false };
    }
  }

  async verifyUserExists(input: { userId: string }): Promise<void> {
    const user = await findUserById(input.userId, {
      select: { id: true },
    });
    if (!user) {
      this.logger.warn({ userId: input.userId }, "User not found");
      throw new NotFoundError("User account not found", {
        userId: input.userId,
      });
    }
  }

  async getSteamConnectionStatus(
    input: GetSteamConnectionStatusInput
  ): Promise<SteamConnectionStatus> {
    const steamData = await getUserSteamData({ userId: input.userId });
    if (!steamData || !steamData.steamId64 || !steamData.steamUsername) {
      return { connected: false };
    }
    return {
      connected: true,
      profile: {
        steamId64: steamData.steamId64,
        displayName: steamData.steamUsername,
        avatarUrl: steamData.steamAvatar || "",
        profileUrl: steamData.steamProfileURL || "",
      },
    };
  }
}
