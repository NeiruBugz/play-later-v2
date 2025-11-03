import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import { LibraryItemStatus, Prisma, type LibraryItem } from "@prisma/client";

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
}: CreateLibraryItemInput): Promise<RepositoryResult<LibraryItem>> {
  try {
    const created = await prisma.libraryItem.create({
      data: {
        ...libraryItem,
        User: { connect: { id: userId } },
        game: { connect: { id: gameId } },
      },
    });

    return repositorySuccess(created);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return repositoryError(
        RepositoryErrorCode.DUPLICATE,
        "Library item already exists"
      );
    }

    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to create library item: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
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
}: GetLibraryItemsForUserByIgdbIdInput): Promise<
  RepositoryResult<LibraryItem[]>
> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { userId, game: { igdbId } },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get library items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getManyLibraryItems({
  userId,
  gameId,
}: GetManyLibraryItemsInput): Promise<RepositoryResult<LibraryItem[]>> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { gameId, userId },
      orderBy: { createdAt: "asc" },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get library items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getLibraryCount({
  userId,
  status,
  gteClause,
}: GetLibraryCountInput): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.libraryItem.count({
      where: { userId, status, ...gteClause },
    });
    return repositorySuccess(count);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get library count: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getPlatformBreakdown({
  userId,
}: {
  userId: string;
}): Promise<
  RepositoryResult<
    Array<{
      platform: string | null;
      _count: number;
    }>
  >
> {
  try {
    const breakdown = await prisma.libraryItem.groupBy({
      by: ["platform"],
      where: { userId, platform: { not: null } },
      _count: true,
      orderBy: { _count: { platform: "desc" } },
      take: 5,
    });
    return repositorySuccess(breakdown);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get platform breakdown: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getAcquisitionTypeBreakdown({
  userId,
}: {
  userId: string;
}): Promise<
  RepositoryResult<
    Array<{
      acquisitionType: string | null;
      _count: number;
    }>
  >
> {
  try {
    const breakdown = await prisma.libraryItem.groupBy({
      by: ["acquisitionType"],
      where: { userId },
      _count: true,
    });
    return repositorySuccess(breakdown);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get acquisition type breakdown: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getRecentlyCompletedLibraryItems({
  userId,
}: {
  userId: string;
}): Promise<
  RepositoryResult<Array<LibraryItem & { game: { title: string } }>>
> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { userId, status: LibraryItemStatus.EXPERIENCED },
      include: { game: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
      take: 3,
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get recently completed items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getUniquePlatforms({
  userId,
}: {
  userId: string;
}): Promise<RepositoryResult<Array<{ platform: string | null }>>> {
  try {
    const platforms = await prisma.libraryItem.findMany({
      where: { userId },
      select: { platform: true },
      distinct: ["platform"],
    });
    return repositorySuccess(platforms);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get unique platforms: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * @deprecated This function has a potential N+1 query issue and fetches ALL library items
 * for ALL users without pagination, which could cause severe performance problems.
 * Use getOtherUsersLibrariesPaginated() instead, which provides proper pagination.
 * This function is kept for backward compatibility but should not be used in new code.
 */
export async function getOtherUsersLibraries({
  userId,
}: {
  userId: string;
}): Promise<RepositoryResult<UserWithLibraryItemsResponse[]>> {
  try {
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

    return repositorySuccess(Object.values(groupedByUser));
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get other users' libraries: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
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
}): Promise<
  RepositoryResult<{
    users: Array<{
      user: Prisma.UserGetPayload<{
        include: {
          _count: { select: { LibraryItem: true } };
          LibraryItem: { include: { game: true } };
        };
      }>;
      previewItems: Array<
        Prisma.LibraryItemGetPayload<{ include: { game: true } }>
      >;
      totalCount: number;
    }>;
    count: number;
  }>
> {
  try {
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

    return repositorySuccess({ users: result, count: total });
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get paginated libraries: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getLibraryByUsername({
  username,
}: {
  username: string;
}): Promise<
  RepositoryResult<
    Array<
      LibraryItem & {
        game: { id: string; title: string; coverImage: string | null };
      }
    >
  >
> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { User: { username } },
      include: {
        game: { select: { id: true, title: true, coverImage: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get library by username: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function getWishlistedItemsByUsername({
  username,
}: {
  username: string;
}): Promise<
  RepositoryResult<
    Array<Prisma.LibraryItemGetPayload<{ include: { game: true } }>>
  >
> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { User: { username }, status: LibraryItemStatus.WISHLIST },
      include: { game: true },
      orderBy: { createdAt: "asc" },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get wishlisted items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function findWishlistItemsForUser({
  userId,
}: {
  userId: string;
}): Promise<
  RepositoryResult<
    Array<Prisma.LibraryItemGetPayload<{ include: { game: true } }>>
  >
> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { userId, status: LibraryItemStatus.WISHLIST },
      include: { game: true },
      orderBy: { createdAt: "asc" },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find wishlist items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function findUpcomingWishlistItems({
  userId,
}: {
  userId: string;
}): Promise<
  RepositoryResult<
    Array<
      LibraryItem & {
        game: {
          igdbId: number;
          title: string;
          coverImage: string | null;
          releaseDate: Date | null;
        };
      }
    >
  >
> {
  try {
    const items = await prisma.libraryItem.findMany({
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
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find upcoming wishlist items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function findCurrentlyPlayingGames({
  userId,
}: {
  userId: string;
}): Promise<
  RepositoryResult<
    Array<
      LibraryItem & {
        game: {
          id: string;
          title: string;
          igdbId: number;
          coverImage: string | null;
        };
      }
    >
  >
> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { userId, status: LibraryItemStatus.CURRENTLY_EXPLORING },
      include: {
        game: {
          select: { id: true, title: true, igdbId: true, coverImage: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find currently playing games: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
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
