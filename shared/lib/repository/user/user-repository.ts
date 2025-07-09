import "server-only";

import { prisma } from "@/shared/lib/db";

import {
  GetUserBySteamIdInput,
  GetUserByUsernameInput,
  UpdateUserSteamDataInput,
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

  if (!user) {
    throw new Error("User not found");
  }

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

  return await prisma.user.update({
    where: { id: userId },
    data: {
      steamId64: steamId,
      username,
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
      steamConnectedAt: true,
      steamProfileURL: true,
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
