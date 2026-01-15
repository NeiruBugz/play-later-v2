import "server-only";

import { LibraryItemStatus } from "@/data-access-layer/domain/library/enums";
import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  withRepositoryError,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import { Prisma, type LibraryItem } from "@prisma/client";

import {
  DEFAULT_ITEMS_PER_PAGE,
  PLATFORM_BREAKDOWN_LIMIT,
  RECENT_COMPLETED_ITEMS_LIMIT,
  RECENT_GAMES_LIMIT,
  USER_PREVIEW_ITEMS_LIMIT,
} from "@/shared/constants";
import { prisma } from "@/shared/lib/app/db";

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
export async function findLibraryItemById({
  libraryItemId,
  userId,
}: {
  libraryItemId: number;
  userId: string;
}): Promise<RepositoryResult<LibraryItem>> {
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
    return repositorySuccess(item);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find library item: ${error instanceof Error ? error.message : "Unknown error"}`
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
  RepositoryResult<
    Array<
      LibraryItem & {
        game: {
          id: string;
          title: string;
          coverImage: string | null;
          slug: string;
        };
      }
    >
  >
> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { userId, game: { igdbId } },
      include: {
        game: {
          select: { id: true, title: true, coverImage: true, slug: true },
        },
      },
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
}: GetManyLibraryItemsInput): Promise<
  RepositoryResult<
    Array<
      LibraryItem & {
        game: {
          id: string;
          title: string;
          coverImage: string | null;
          slug: string;
        };
      }
    >
  >
> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { gameId, userId },
      include: {
        game: {
          select: { id: true, title: true, coverImage: true, slug: true },
        },
      },
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
  return withRepositoryError(
    () => prisma.libraryItem.count({ where: { userId, status, ...gteClause } }),
    "Failed to get library count"
  );
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
      take: PLATFORM_BREAKDOWN_LIMIT,
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
  return withRepositoryError(
    () =>
      prisma.libraryItem.findMany({
        where: { userId, status: LibraryItemStatus.PLAYED },
        include: { game: { select: { title: true } } },
        orderBy: { completedAt: "desc" },
        take: RECENT_COMPLETED_ITEMS_LIMIT,
      }),
    "Failed to get recently completed items"
  );
}
export async function getUniquePlatforms({
  userId,
}: {
  userId: string;
}): Promise<RepositoryResult<Array<{ platform: string | null }>>> {
  return withRepositoryError(
    () =>
      prisma.libraryItem.findMany({
        where: { userId },
        select: { platform: true },
        distinct: ["platform"],
      }),
    "Failed to get unique platforms"
  );
}

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
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
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
            take: USER_PREVIEW_ITEMS_LIMIT,
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
export async function getWantToPlayItemsByUsername({
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
      where: { User: { username }, status: LibraryItemStatus.WANT_TO_PLAY },
      include: { game: true },
      orderBy: { createdAt: "asc" },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to get want-to-play items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function findWantToPlayItemsForUser({
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
      where: { userId, status: LibraryItemStatus.WANT_TO_PLAY },
      include: { game: true },
      orderBy: { createdAt: "asc" },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find want-to-play items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
export async function findUpcomingWantToPlayItems({
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
        status: LibraryItemStatus.WANT_TO_PLAY,
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
      `Failed to find upcoming want-to-play items: ${error instanceof Error ? error.message : "Unknown error"}`
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
      where: { userId, status: LibraryItemStatus.PLAYING },
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
          status: LibraryItemStatus.PLAYING,
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
        take: RECENT_GAMES_LIMIT,
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

export async function findMostRecentLibraryItemByGameId(params: {
  userId: string;
  gameId: string;
}): Promise<RepositoryResult<LibraryItem | null>> {
  try {
    const item = await prisma.libraryItem.findFirst({
      where: { userId: params.userId, gameId: params.gameId },
      orderBy: { updatedAt: "desc" },
    });
    return repositorySuccess(item);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find most recent library item: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function findAllLibraryItemsByGameId(params: {
  userId: string;
  gameId: string;
}): Promise<RepositoryResult<LibraryItem[]>> {
  try {
    const items = await prisma.libraryItem.findMany({
      where: { userId: params.userId, gameId: params.gameId },
      orderBy: { createdAt: "asc" },
    });
    return repositorySuccess(items);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find all library items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
type LibraryItemWithGameAndCount = LibraryItem & {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
    slug: string;
    releaseDate: Date | null;
    _count: {
      libraryItems: number;
    };
  };
};

export type FindLibraryItemsResult = {
  items: LibraryItemWithGameAndCount[];
  total: number;
};

export async function countLibraryItemsByUserId(
  userId: string
): Promise<RepositoryResult<number>> {
  return withRepositoryError(
    () => prisma.libraryItem.count({ where: { userId } }),
    "Failed to count library items"
  );
}

export async function hasLibraryItemWithStatus(
  userId: string,
  status: LibraryItemStatus
): Promise<RepositoryResult<boolean>> {
  try {
    const item = await prisma.libraryItem.findFirst({
      where: { userId, status },
      select: { id: true },
    });
    return repositorySuccess(item !== null);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to check library item status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function findLibraryItemsWithFilters(params: {
  userId: string;
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy?: "createdAt" | "releaseDate" | "startedAt" | "completedAt";
  sortOrder?: "asc" | "desc";
  distinctByGame?: boolean;
  skip?: number;
  take?: number;
}): Promise<RepositoryResult<FindLibraryItemsResult>> {
  try {
    const {
      userId,
      status,
      platform,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      distinctByGame = false,
      skip,
      take,
    } = params;
    const whereClause: Prisma.LibraryItemWhereInput = {
      userId,
      ...(status && { status }),
      ...(platform && { platform }),
      ...(search && {
        game: { title: { contains: search, mode: "insensitive" } },
      }),
    };
    let orderByClause: Prisma.LibraryItemOrderByWithRelationInput;
    switch (sortBy) {
      case "releaseDate":
        orderByClause = { game: { releaseDate: sortOrder } };
        break;
      case "startedAt":
        orderByClause = { startedAt: sortOrder };
        break;
      case "completedAt":
        orderByClause = { completedAt: sortOrder };
        break;
      case "createdAt":
      default:
        orderByClause = { createdAt: sortOrder };
        break;
    }
    const isPaginated = skip !== undefined || take !== undefined;

    const [items, total] = await Promise.all([
      prisma.libraryItem.findMany({
        where: whereClause,
        orderBy: orderByClause,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
        include: {
          game: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              slug: true,
              releaseDate: true,
              _count: {
                select: {
                  libraryItems: { where: { userId } },
                },
              },
            },
          },
        },
      }),
      prisma.libraryItem.count({ where: whereClause }),
    ]);

    if (!distinctByGame || isPaginated) {
      return repositorySuccess({ items, total });
    }
    const deduplicatedItems = Array.from(
      items
        .reduce((map, item) => {
          const existing = map.get(item.gameId);
          if (
            !existing ||
            item.updatedAt.getTime() > existing.updatedAt.getTime()
          ) {
            map.set(item.gameId, item);
          }
          return map;
        }, new Map<string, LibraryItemWithGameAndCount>())
        .values()
    );

    const sortedItems = deduplicatedItems.sort((a, b) => {
      let aValue: Date | null | undefined;
      let bValue: Date | null | undefined;
      switch (sortBy) {
        case "releaseDate":
          aValue = a.game.releaseDate;
          bValue = b.game.releaseDate;
          break;
        case "startedAt":
          aValue = a.startedAt;
          bValue = b.startedAt;
          break;
        case "completedAt":
          aValue = a.completedAt;
          bValue = b.completedAt;
          break;
        case "createdAt":
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
      }

      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;
      const comparison = aValue.getTime() - bValue.getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return repositorySuccess({ items: sortedItems, total: sortedItems.length });
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find library items: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
