import "server-only";

import { BacklogItemStatus } from "@prisma/client";

import { prisma } from "@/shared/lib/db";

import type {
  CreateBacklogItemInput,
  DeleteBacklogItemInput,
  GetBacklogCountInput,
  GetBacklogItemsForUserByIgdbIdInput,
  GetManyBacklogItemsInput,
  UpdateBacklogItemInput,
  UserWithBacklogItemsResponse,
} from "./types";

export async function createBacklogItem({
  backlogItem,
  userId,
  gameId,
}: CreateBacklogItemInput) {
  return prisma.backlogItem.create({
    data: {
      ...backlogItem,
      User: {
        connect: {
          id: userId,
        },
      },
      game: {
        connect: {
          id: gameId,
        },
      },
    },
  });
}

export async function deleteBacklogItem({
  backlogItemId,
  userId,
}: DeleteBacklogItemInput) {
  const item = await prisma.backlogItem.findUnique({
    where: {
      id: backlogItemId,
      userId,
    },
  });

  if (!item) {
    throw new Error("Backlog item not found");
  }

  return prisma.backlogItem.delete({
    where: {
      id: backlogItemId,
    },
  });
}

export async function updateBacklogItem({
  userId,
  backlogItem,
}: UpdateBacklogItemInput) {
  const item = await prisma.backlogItem.findUnique({
    where: {
      id: backlogItem.id,
      userId,
    },
  });

  if (!item) {
    throw new Error("Backlog item not found");
  }

  return prisma.backlogItem.update({
    where: {
      id: backlogItem.id,
    },
    data: {
      ...backlogItem,
    },
  });
}

export async function getBacklogItemsForUserByIgdbId({
  userId,
  igdbId,
}: GetBacklogItemsForUserByIgdbIdInput) {
  const items = await prisma.backlogItem.findMany({
    where: {
      userId,
      game: {
        igdbId,
      },
    },
  });
  return items;
}

export async function getManyBacklogItems({
  userId,
  gameId,
}: GetManyBacklogItemsInput) {
  return await prisma.backlogItem.findMany({
    where: { gameId, userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getBacklogCount({
  userId,
  status,
  gteClause,
}: GetBacklogCountInput) {
  return await prisma.backlogItem.count({
    where: { userId, status, ...gteClause },
  });
}

export async function getPlatformBreakdown({ userId }: { userId: string }) {
  return await prisma.backlogItem.groupBy({
    by: ["platform"],
    where: {
      userId,
      platform: { not: null },
    },
    _count: true,
    orderBy: {
      _count: {
        platform: "desc",
      },
    },
    take: 5,
  });
}

export async function getAcquisitionTypeBreakdown({
  userId,
}: {
  userId: string;
}) {
  return await prisma.backlogItem.groupBy({
    by: ["acquisitionType"],
    where: { userId },
    _count: true,
  });
}

export async function getRecentlyCompletedBacklogItems({
  userId,
}: {
  userId: string;
}) {
  return prisma.backlogItem.findMany({
    where: {
      userId,
      status: "COMPLETED",
    },
    include: {
      game: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      completedAt: "desc",
    },
    take: 3,
  });
}

export async function getUniquePlatforms({ userId }: { userId: string }) {
  return await prisma.backlogItem.findMany({
    where: { userId },
    select: { platform: true },
    distinct: ["platform"],
  });
}

export async function getOtherUsersBacklogs({ userId }: { userId: string }) {
  const userGames = await prisma.backlogItem.findMany({
    where: {
      userId: { not: userId },
      User: { username: { not: null } },
    },
    include: { game: true, User: true },
    orderBy: { createdAt: "asc" },
  });

  const groupedByUser = userGames.reduce(
    (acc: Record<string, UserWithBacklogItemsResponse>, item) => {
      const { User } = item;
      acc[User.id] ??= { user: User, backlogItems: [] };
      acc[User.id].backlogItems.push(item);
      return acc;
    },
    {}
  );

  return Object.values(groupedByUser);
}

export async function getBacklogByUsername({ username }: { username: string }) {
  return await prisma.backlogItem.findMany({
    where: { User: { username: username } },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          coverImage: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWishlistedItemsByUsername({
  username,
}: {
  username: string;
}) {
  return await prisma.backlogItem.findMany({
    where: {
      User: {
        username: username,
      },
      status: BacklogItemStatus.WISHLIST,
    },
    include: {
      game: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function findWishlistItemsForUser({ userId }: { userId: string }) {
  return await prisma.backlogItem.findMany({
    where: { userId, status: BacklogItemStatus.WISHLIST },
    include: {
      game: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
