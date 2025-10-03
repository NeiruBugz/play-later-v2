import "server-only";

import { LibraryItemStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/shared/lib/db";
import { findOrCreateGameByIgdbId } from "@/shared/lib/repository/game/game-repository";

import type {
  AddGameToUserLibraryInput,
  CreateLibraryItemInput,
  DeleteLibraryItemInput,
  GetLibraryCountInput,
  GetLibraryItemsForUserByIgdbIdInput,
  GetManyLibraryItemsInput,
  UpdateLibraryItemInput,
  UserWithLibraryItemsResponse,
} from "./types";

export async function createLibraryItem({
  libraryItem,
  userId,
  gameId,
}: CreateLibraryItemInput) {
  return prisma.libraryItem.create({
    data: {
      ...libraryItem,
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

export async function deleteLibraryItem({
  libraryItemId,
  userId,
}: DeleteLibraryItemInput) {
  const item = await prisma.libraryItem.findUnique({
    where: {
      id: libraryItemId,
      userId,
    },
  });

  if (!item) {
    throw new Error("Library item not found");
  }

  return prisma.libraryItem.delete({
    where: {
      id: libraryItemId,
    },
  });
}

export async function updateLibraryItem({
  userId,
  libraryItem,
}: UpdateLibraryItemInput) {
  const item = await prisma.libraryItem.findUnique({
    where: {
      id: libraryItem.id,
      userId,
    },
  });

  if (!item) {
    throw new Error("Library item not found");
  }

  return prisma.libraryItem.update({
    where: {
      id: libraryItem.id,
    },
    data: {
      ...libraryItem,
    },
  });
}

export async function getLibraryItemsForUserByIgdbId({
  userId,
  igdbId,
}: GetLibraryItemsForUserByIgdbIdInput) {
  const items = await prisma.libraryItem.findMany({
    where: {
      userId,
      game: {
        igdbId,
      },
    },
  });
  return items;
}

export async function getManyLibraryItems({
  userId,
  gameId,
}: GetManyLibraryItemsInput) {
  return prisma.libraryItem.findMany({
    where: { gameId, userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getLibraryCount({
  userId,
  status,
  gteClause,
}: GetLibraryCountInput) {
  return prisma.libraryItem.count({
    where: { userId, status, ...gteClause },
  });
}

export async function getPlatformBreakdown({ userId }: { userId: string }) {
  return prisma.libraryItem.groupBy({
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
  return prisma.libraryItem.groupBy({
    by: ["acquisitionType"],
    where: { userId },
    _count: true,
  });
}

export async function getRecentlyCompletedLibraryItems({
  userId,
}: {
  userId: string;
}) {
  return prisma.libraryItem.findMany({
    where: {
      userId,
      status: LibraryItemStatus.EXPERIENCED,
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
  return prisma.libraryItem.findMany({
    where: { userId },
    select: { platform: true },
    distinct: ["platform"],
  });
}

export async function getOtherUsersLibraries({ userId }: { userId: string }) {
  const userGames = await prisma.libraryItem.findMany({
    where: {
      userId: { not: userId },
      User: { username: { not: null } },
    },
    include: { game: true, User: true },
    orderBy: { createdAt: "asc" },
  });

  const groupedByUser = userGames.reduce(
    (acc: Record<string, UserWithLibraryItemsResponse>, item) => {
      const { User } = item;
      acc[User.id] ??= { user: User, libraryItems: [] };
      acc[User.id].libraryItems.push(item);
      return acc;
    },
    {}
  );

  return Object.values(groupedByUser);
}

export async function getLibraryByUsername({ username }: { username: string }) {
  return prisma.libraryItem.findMany({
    where: { User: { username } },
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
  return prisma.libraryItem.findMany({
    where: {
      User: {
        username,
      },
      status: LibraryItemStatus.WISHLIST,
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
  return prisma.libraryItem.findMany({
    where: { userId, status: LibraryItemStatus.WISHLIST },
    include: {
      game: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function findUpcomingWishlistItems({
  userId,
}: {
  userId: string;
}) {
  return prisma.libraryItem.findMany({
    where: {
      userId,
      status: LibraryItemStatus.WISHLIST,
      game: {
        releaseDate: {
          gte: new Date(),
        },
      },
    },
    include: {
      game: {
        select: {
          igdbId: true,
          title: true,
          coverImage: true,
          releaseDate: true,
        },
      },
    },
  });
}

export async function findCurrentlyPlayingGames({
  userId,
}: {
  userId: string;
}) {
  return prisma.libraryItem.findMany({
    where: {
      userId,
      status: LibraryItemStatus.CURRENTLY_EXPLORING,
    },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          igdbId: true,
          coverImage: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export function buildCollectionFilter({
  userId,
  platform,
  status,
  search,
}: {
  userId: string;
  platform?: string;
  status?: string;
  search?: string;
}): {
  gameFilter: Prisma.GameWhereInput;
  libraryFilter: Prisma.LibraryItemWhereInput;
} {
  const libraryFilter: Prisma.LibraryItemWhereInput = {
    userId,
    platform: platform === "" ? undefined : platform,
    status: status === "" ? undefined : (status as LibraryItemStatus),
  };

  const gameFilter: Prisma.GameWhereInput = {
    libraryItems: { some: libraryFilter },
    ...(search != null && {
      title: {
        contains: search,
        mode: "insensitive",
      },
    }),
  };

  return { gameFilter, libraryFilter };
}

export async function addGameToUserLibrary({
  userId,
  igdbId,
  libraryItem,
}: AddGameToUserLibraryInput) {
  return prisma.$transaction(async () => {
    const game = await findOrCreateGameByIgdbId({ igdbId });

    await createLibraryItem({
      libraryItem,
      userId,
      gameId: game.id,
    });

    return game;
  });
}
