import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import {
  LibraryItemStatus,
  type LibraryItem,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/shared/lib";

import type {
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
      User: { connect: { id: userId } },
      game: { connect: { id: gameId } },
    },
  });
}

export async function deleteLibraryItem({
  libraryItemId,
  userId,
}: DeleteLibraryItemInput): Promise<RepositoryResult<{ id: number }>> {
  try {
    const item = await prisma.libraryItem.findFirst({
      where: { id: libraryItemId, userId },
    });

    if (!item) {
      return repositoryError(
        RepositoryErrorCode.NOT_FOUND,
        "Library item not found"
      );
    }

    const deleted = await prisma.libraryItem.delete({
      where: { id: libraryItemId },
    });

    return repositorySuccess({ id: deleted.id });
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to delete library item: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function updateLibraryItem({
  userId,
  libraryItem,
}: UpdateLibraryItemInput): Promise<RepositoryResult<LibraryItem>> {
  try {
    const item = await prisma.libraryItem.findFirst({
      where: { id: libraryItem.id, userId },
    });

    if (!item) {
      return repositoryError(
        RepositoryErrorCode.NOT_FOUND,
        "Library item not found"
      );
    }

    // Exclude id from update payload (Prisma forbids updating primary key)
    const { id, ...updateData } = libraryItem;

    const updated = await prisma.libraryItem.update({
      where: { id },
      data: updateData,
    });

    return repositorySuccess(updated);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to update library item: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getLibraryItemsForUserByIgdbId({
  userId,
  igdbId,
}: GetLibraryItemsForUserByIgdbIdInput) {
  const items = await prisma.libraryItem.findMany({
    where: { userId, game: { igdbId } },
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
  return prisma.libraryItem.count({ where: { userId, status, ...gteClause } });
}

export async function getPlatformBreakdown({ userId }: { userId: string }) {
  return prisma.libraryItem.groupBy({
    by: ["platform"],
    where: { userId, platform: { not: null } },
    _count: true,
    orderBy: { _count: { platform: "desc" } },
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
    where: { userId, status: LibraryItemStatus.EXPERIENCED },
    include: { game: { select: { title: true } } },
    orderBy: { completedAt: "desc" },
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

/**
 * @deprecated This function has a potential N+1 query issue and fetches ALL library items
 * for ALL users without pagination, which could cause severe performance problems.
 * Use getOtherUsersLibrariesPaginated() instead, which provides proper pagination.
 * This function is kept for backward compatibility but should not be used in new code.
 */
export async function getOtherUsersLibraries({ userId }: { userId: string }) {
  const userGames = await prisma.libraryItem.findMany({
    where: { userId: { not: userId }, User: { username: { not: null } } },
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

export async function getOtherUsersLibrariesPaginated({
  userId,
  page = 1,
  itemsPerPage = 24,
  search,
}: {
  userId: string;
  page?: number;
  itemsPerPage?: number;
  search?: string;
}) {
  const skip = Math.max((page || 1) - 1, 0) * itemsPerPage;
  const userWhere: Prisma.UserWhereInput = {
    id: { not: userId },
    username: { not: null },
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: userWhere,
      orderBy: { username: "asc" },
      skip,
      take: itemsPerPage,
      include: {
        _count: { select: { LibraryItem: true } },
        LibraryItem: {
          include: { game: true },
          orderBy: { createdAt: "asc" },
          take: 3,
        },
      },
    }),
    prisma.user.count({ where: userWhere }),
  ]);

  const result = users.map((u) => ({
    user: u,
    previewItems: u.LibraryItem,
    totalCount: u._count.LibraryItem,
  }));

  return { users: result, count: total };
}

export async function getLibraryByUsername({ username }: { username: string }) {
  return prisma.libraryItem.findMany({
    where: { User: { username } },
    include: { game: { select: { id: true, title: true, coverImage: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWishlistedItemsByUsername({
  username,
}: {
  username: string;
}) {
  return prisma.libraryItem.findMany({
    where: { User: { username }, status: LibraryItemStatus.WISHLIST },
    include: { game: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function findWishlistItemsForUser({ userId }: { userId: string }) {
  return prisma.libraryItem.findMany({
    where: { userId, status: LibraryItemStatus.WISHLIST },
    include: { game: true },
    orderBy: { createdAt: "asc" },
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
      game: { releaseDate: { gte: new Date() } },
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
    where: { userId, status: LibraryItemStatus.CURRENTLY_EXPLORING },
    include: {
      game: {
        select: { id: true, title: true, igdbId: true, coverImage: true },
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
    ...(search != null && { title: { contains: search, mode: "insensitive" } }),
  };

  return { gameFilter, libraryFilter };
}

// addGameToUserLibrary was removed as part of cleanup.

/**
 * Get library statistics for a user
 * Returns the count of games in each journey status and recent games
 * @param userId - The user's unique identifier
 * @returns Result object with status counts and recent games or error
 */
export async function getLibraryStatsByUserId(userId: string): Promise<
  RepositoryResult<{
    statusCounts: Record<string, number>;
    recentGames: Array<{
      gameId: string;
      title: string;
      coverImage: string | null;
      lastPlayed: Date;
    }>;
  }>
> {
  try {
    const [statusCountsRaw, recentItems] = await Promise.all([
      prisma.libraryItem.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),
      prisma.libraryItem.findMany({
        where: {
          userId,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        },
        include: {
          game: {
            select: {
              id: true,
              title: true,
              coverImage: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    const statusCounts = statusCountsRaw.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const recentGames = recentItems.map((item) => ({
      gameId: item.game.id,
      title: item.game.title,
      coverImage: item.game.coverImage,
      lastPlayed: item.updatedAt,
    }));

    return repositorySuccess({
      statusCounts,
      recentGames,
    });
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to fetch library stats: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
