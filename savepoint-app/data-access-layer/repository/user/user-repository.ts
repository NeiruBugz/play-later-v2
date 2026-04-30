import "server-only";

import { Prisma, type User } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";
import { ConflictError, NotFoundError } from "@/shared/lib/errors";

import {
  type GetUserBySteamIdInput,
  type GetUserByUsernameInput,
  type UpdateUserDataInput,
  type UpdateUserSteamDataInput,
} from "./types";

export async function getUserBySteamId({
  userId,
  steamId,
}: GetUserBySteamIdInput): Promise<User | null> {
  return prisma.user.findFirst({
    where: { steamId64: steamId, id: { not: userId } },
  });
}

export async function updateUserSteamData({
  userId,
  steamId,
  username,
  avatar,
  profileUrl,
  connectedAt,
}: UpdateUserSteamDataInput): Promise<User> {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        steamId64: steamId,
        steamUsername: username,
        steamAvatar: avatar,
        ...(profileUrl !== undefined && { steamProfileURL: profileUrl }),
        ...(connectedAt !== undefined && { steamConnectedAt: connectedAt }),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("User not found while updating Steam data", {
        userId,
      });
    }
    throw error;
  }
}

export async function getUserByUsername({
  username,
}: GetUserByUsernameInput): Promise<{ username: string | null } | null> {
  return prisma.user.findUnique({
    where: { usernameNormalized: username.toLowerCase().trim() },
    select: { username: true },
  });
}

export async function getUserSteamData({
  userId,
}: {
  userId: string;
}): Promise<{
  steamId64: string | null;
  steamUsername: string | null;
  steamAvatar: string | null;
  steamProfileURL: string | null;
  steamConnectedAt: Date | null;
} | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      steamId64: true,
      steamUsername: true,
      steamAvatar: true,
      steamProfileURL: true,
      steamConnectedAt: true,
    },
  });
}

export async function getUserInfo({ userId }: { userId: string }): Promise<{
  id: string;
  name: string | null;
  username: string | null;
  steamProfileURL: string | null;
  steamConnectedAt: Date | null;
  email: string | null;
} | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      steamProfileURL: true,
      steamConnectedAt: true,
      email: true,
    },
  });
}

export async function updateUserData({
  userId,
  username,
  steamProfileUrl,
}: UpdateUserDataInput): Promise<User> {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { username, steamProfileURL: steamProfileUrl },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("User not found while updating user data", {
        userId,
      });
    }
    throw error;
  }
}

export async function getUserSteamId({
  steamUsername,
  userId,
}: {
  steamUsername: string;
  userId: string;
}): Promise<{ steamId64: string | null } | null> {
  return prisma.user.findUnique({
    where: { steamUsername, id: userId },
    select: { steamId64: true },
  });
}

export async function disconnectSteam({
  userId,
}: {
  userId: string;
}): Promise<User> {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        steamId64: null,
        steamUsername: null,
        steamProfileURL: null,
        steamAvatar: null,
        steamConnectedAt: null,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("User not found while disconnecting Steam", {
        userId,
      });
    }
    throw error;
  }
}

export async function findUserByEmail(
  email: string
): Promise<{ id: string } | null> {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
}

export async function createUserWithCredentials(input: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<{ id: string; email: string | null; name: string | null }> {
  try {
    return await prisma.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        name: input.name ?? null,
      },
      select: { id: true, email: true, name: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError("User with this email already exists", {
        email: input.email,
      });
    }
    throw error;
  }
}

export async function findUserById<T extends Prisma.UserSelect>(
  userId: string,
  options: { select: T }
): Promise<Prisma.UserGetPayload<{ select: T }> | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: options.select,
  });
}

export async function findUserByNormalizedUsername(
  usernameNormalized: string
): Promise<{ id: string } | null> {
  return prisma.user.findUnique({
    where: { usernameNormalized },
    select: { id: true },
  });
}

const PUBLIC_PROFILE_SELECT = {
  id: true,
  name: true,
  username: true,
  image: true,
  isPublicProfile: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicProfileUser = Prisma.UserGetPayload<{
  select: typeof PUBLIC_PROFILE_SELECT;
}>;

export async function findUserByUsername(
  username: string
): Promise<PublicProfileUser | null> {
  return prisma.user.findUnique({
    where: { usernameNormalized: username.toLowerCase().trim() },
    select: PUBLIC_PROFILE_SELECT,
  });
}

export async function updateOnboardingDismissed(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingDismissedAt: new Date() },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError(
        "User not found while updating onboarding status",
        { userId }
      );
    }
    throw error;
  }
}

export async function getOnboardingStatus(userId: string): Promise<{
  profileSetupCompletedAt: Date | null;
  onboardingDismissedAt: Date | null;
} | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      profileSetupCompletedAt: true,
      onboardingDismissedAt: true,
    },
  });
}

export async function updateUserProfile(
  userId: string,
  data: {
    username?: string;
    usernameNormalized?: string;
    image?: string;
    isPublicProfile?: boolean;
    profileSetupCompletedAt?: Date | null;
  }
): Promise<{
  id: string;
  username: string | null;
  usernameNormalized: string | null;
  steamProfileURL: string | null;
  image: string | null;
  isPublicProfile: boolean;
  profileSetupCompletedAt: Date | null;
}> {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        usernameNormalized: true,
        steamProfileURL: true,
        image: true,
        isPublicProfile: true,
        profileSetupCompletedAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("User not found while updating profile", {
        userId,
      });
    }
    throw error;
  }
}
