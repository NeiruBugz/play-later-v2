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
import { cacheLife, cacheTag } from "next/cache";

import { validateUsername } from "@/features/profile/lib";
import {
  NEW_USER_THRESHOLD_MS,
  SUGGESTED_USERNAME_MAX_LENGTH,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT, userTags } from "@/shared/lib";
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

async function getCachedProfile(userId: string): Promise<Profile> {
  "use cache";
  cacheTag(userTags(userId).profile);
  cacheLife("minutes");

  const user = await findUserById(userId, {
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
    throw new NotFoundError("User not found", { userId });
  }
  return mapUserToProfile(user);
}

async function getCachedProfileWithStats(
  userId: string
): Promise<ProfileWithStats> {
  "use cache";
  cacheTag(userTags(userId).profileStats);
  cacheLife("seconds");

  const [user, stats, gameCount, libraryPreview, ratingHistogram] =
    await Promise.all([
      findUserById(userId, {
        select: {
          username: true,
          image: true,
          email: true,
          name: true,
          createdAt: true,
          isPublicProfile: true,
        },
      }),
      getLibraryStatsByUserId(userId),
      countLibraryItemsByUserId(userId),
      findLibraryPreview(userId),
      getRatingHistogram({ userId }),
    ]);
  if (!user) {
    throw new NotFoundError("User not found", { userId });
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

class UserNotFoundForSetup extends Error {
  constructor() {
    super("User not found during setup-status check");
    this.name = "UserNotFoundForSetup";
  }
}

async function getCachedSetupStatus(userId: string): Promise<{
  needsSetup: boolean;
  suggestedUsername?: string;
}> {
  "use cache";
  cacheTag(userTags(userId).setup);
  cacheLife("minutes");

  const user = await findUserById(userId, {
    select: {
      username: true,
      name: true,
      profileSetupCompletedAt: true,
      createdAt: true,
    },
  });
  if (!user) {
    throw new UserNotFoundForSetup();
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

async function getCachedSteamConnectionStatus(
  userId: string
): Promise<SteamConnectionStatus> {
  "use cache";
  cacheTag(userTags(userId).steamConnection);
  cacheLife("minutes");

  const steamData = await getUserSteamData({ userId });
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

export class ProfileService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "ProfileService" });

  async getProfile(input: GetProfileInput): Promise<Profile> {
    try {
      return await getCachedProfile(input.userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        this.logger.warn({ userId: input.userId }, "User not found");
      }
      throw error;
    }
  }

  async getProfileWithStats(
    input: GetProfileWithStatsInput
  ): Promise<ProfileWithStats> {
    try {
      return await getCachedProfileWithStats(input.userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        this.logger.warn({ userId: input.userId }, "User not found");
      }
      throw error;
    }
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
    try {
      return await getCachedSetupStatus(input.userId);
    } catch (error) {
      if (error instanceof UserNotFoundForSetup) {
        this.logger.warn({ userId: input.userId }, "User not found");
        throw new NotFoundError("User not found", { userId: input.userId });
      }
      throw error;
    }
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
    return getCachedSteamConnectionStatus(input.userId);
  }
}
