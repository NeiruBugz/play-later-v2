import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/shared/lib";

import {
  type DefaultUserSelect,
  type GetUserBySteamIdInput,
  type GetUserByUsernameInput,
  type UpdateUserDataInput,
  type UpdateUserSteamDataInput,
} from "./types";

export async function getUserBySteamId({
  userId,
  steamId,
}: GetUserBySteamIdInput) {
  const user = await prisma.user.findFirst({
    where: {
      steamId64: steamId,
      id: { not: userId },
    },
  });

  return user;
}

export async function updateUserSteamData({
  userId,
  steamId,
  username,
  avatar,
}: UpdateUserSteamDataInput) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      steamId64: steamId,
      steamUsername: username,
      steamAvatar: avatar,
    },
  });
}

export async function getUserByUsername({ username }: GetUserByUsernameInput) {
  const user = await prisma.user.findFirst({
    where: { username },
    select: {
      username: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getUserSteamData({ userId }: { userId: string }) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      steamId64: true,
      steamUsername: true,
      steamProfileURL: true,
      steamConnectedAt: true,
    },
  });
}

export async function getUserInfo({ userId }: { userId: string }) {
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
}: UpdateUserDataInput) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      username,
      steamProfileURL: steamProfileUrl,
    },
  });
}

export async function getUserSteamId({
  steamUsername,
  userId,
}: {
  steamUsername: string;
  userId: string;
}) {
  return prisma.user.findUnique({
    where: { steamUsername, id: userId },
    select: { steamId64: true },
  });
}

export async function disconnectSteam({ userId }: { userId: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      steamId64: null,
      steamUsername: null,
      steamProfileURL: null,
      steamAvatar: null,
      steamConnectedAt: null,
    },
  });
}

export async function findUserById(
  userId: string
): Promise<DefaultUserSelect | null>;
export async function findUserById<T extends Prisma.UserSelect>(
  userId: string,
  options: { select: T }
): Promise<Prisma.UserGetPayload<{ select: T }> | null>;
export async function findUserById<T extends Prisma.UserSelect>(
  userId: string,
  options?: { select?: T }
): Promise<DefaultUserSelect | Prisma.UserGetPayload<{ select: T }> | null> {
  const defaultSelect = {
    id: true,
    name: true,
    username: true,
    steamProfileURL: true,
    steamConnectedAt: true,
    email: true,
  } as const;

  return prisma.user.findUnique({
    where: { id: userId },
    select: options?.select ?? (defaultSelect as T),
  }) as Promise<
    DefaultUserSelect | Prisma.UserGetPayload<{ select: T }> | null
  >;
}

export async function findUserByNormalizedUsername(usernameNormalized: string) {
  return prisma.user.findUnique({
    where: { usernameNormalized },
    select: { id: true },
  });
}

/**
 * Update user profile fields
 */
export async function updateUserProfile(
  userId: string,
  data: {
    username?: string;
    usernameNormalized?: string;
    image?: string;
    profileSetupCompletedAt?: Date | null;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      usernameNormalized: true,
      steamProfileURL: true,
      image: true,
      profileSetupCompletedAt: true,
    },
  });
}
