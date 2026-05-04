import "server-only";

import {
  countLibraryItemsByStatus,
  createLibraryItem,
  deleteLibraryItem,
  findAllLibraryItemsByGameId,
  findGameByIgdbId,
  findKnownPlatforms,
  findLibraryItemById,
  findLibraryItemsWithFilters,
  findMostRecentLibraryItemByGameId,
  findMostRecentPlayingGame,
  findWishlistItemsForUser,
  getRatingHistogram,
  setRating as libraryRepositorySetRating,
  updateLibraryItem,
  type FindLibraryItemsResult,
  type KnownPlatform,
} from "@/data-access-layer/repository";
import {
  AcquisitionType,
  LibraryItemStatus,
  type LibraryItem,
} from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

type SortField =
  | "updatedAt"
  | "createdAt"
  | "releaseDate"
  | "startedAt"
  | "completedAt"
  | "title"
  | "rating-desc"
  | "rating-asc";
type GetLibraryItemsParams = {
  userId: string;
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy?: SortField;
  sortOrder?: "asc" | "desc";
  minRating?: number;
  unratedOnly?: boolean;
  distinctByGame?: boolean;
  offset?: number;
  limit?: number;
};

export type GetLibraryItemsResult = {
  items: FindLibraryItemsResult["items"];
  total: number;
  hasMore: boolean;
};
export class LibraryService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "LibraryService" });

  async findGameByIgdbId(igdbId: number) {
    return findGameByIgdbId(igdbId);
  }

  async listPlatforms(): Promise<KnownPlatform[]> {
    return findKnownPlatforms();
  }

  async getMostRecentPlayingGame(params: { userId: string }): Promise<{
    gameId: string;
    igdbId: number;
    name: string;
    coverImageId: string | null;
  } | null> {
    const data = await findMostRecentPlayingGame(params);

    if (!data) {
      return null;
    }

    return {
      gameId: data.game.id,
      igdbId: data.game.igdbId,
      name: data.game.title,
      coverImageId: data.game.coverImage,
    };
  }

  async findMostRecentLibraryItemByGameId(params: {
    userId: string;
    gameId: string;
  }): Promise<LibraryItem | null> {
    return findMostRecentLibraryItemByGameId(params);
  }

  async updateLibraryItem(params: {
    userId: string;
    libraryItem: {
      id: number;
      status: LibraryItemStatus;
      startedAt?: Date;
      completedAt?: Date;
      statusChangedAt?: Date;
      platform?: string | null;
    };
  }): Promise<LibraryItem> {
    const existingItem = await findLibraryItemById({
      libraryItemId: params.libraryItem.id,
      userId: params.userId,
    });
    const statusChanged = params.libraryItem.status !== existingItem.status;
    const isTransitioningToPlayed =
      params.libraryItem.status === LibraryItemStatus.PLAYED;
    return updateLibraryItem({
      userId: params.userId,
      libraryItem: {
        id: params.libraryItem.id,
        status: params.libraryItem.status,
        startedAt: params.libraryItem.startedAt,
        completedAt: params.libraryItem.completedAt,
        statusChangedAt:
          params.libraryItem.statusChangedAt ??
          (statusChanged ? new Date() : undefined),
        ...(params.libraryItem.platform !== undefined && {
          platform: params.libraryItem.platform,
        }),
        ...(isTransitioningToPlayed && { hasBeenPlayed: true }),
      },
    });
  }

  async findAllLibraryItemsByGameId(params: {
    userId: string;
    gameId: string;
  }): Promise<LibraryItem[]> {
    return findAllLibraryItemsByGameId(params);
  }

  async getLibraryItems(
    params: GetLibraryItemsParams
  ): Promise<GetLibraryItemsResult> {
    const { offset, limit, unratedOnly, ...restParams } = params;

    const effectiveParams = {
      ...restParams,
      ...(unratedOnly ? { unratedOnly, minRating: undefined } : {}),
    };

    const data = await findLibraryItemsWithFilters({
      ...effectiveParams,
      skip: offset,
      take: limit,
    });

    const currentOffset = offset ?? 0;
    const hasMore = currentOffset + data.items.length < data.total;

    return {
      items: data.items,
      total: data.total,
      hasMore,
    };
  }

  async getStatusCounts(input: {
    userId: string;
    platform?: string;
    search?: string;
  }): Promise<Record<LibraryItemStatus, number>> {
    return countLibraryItemsByStatus(input);
  }

  async deleteLibraryItem(params: {
    libraryItemId: number;
    userId: string;
  }): Promise<void> {
    await deleteLibraryItem({
      libraryItemId: params.libraryItemId,
      userId: params.userId,
    });
  }

  async createLibraryItem(params: {
    userId: string;
    gameId: string;
    libraryItem: {
      status: LibraryItemStatus;
      acquisitionType: AcquisitionType;
      platform?: string;
      startedAt?: Date;
      completedAt?: Date;
    };
  }): Promise<LibraryItem> {
    const isPlayed = params.libraryItem.status === LibraryItemStatus.PLAYED;
    return createLibraryItem({
      userId: params.userId,
      gameId: params.gameId,
      libraryItem: {
        status: params.libraryItem.status,
        acquisitionType: params.libraryItem.acquisitionType,
        platform: params.libraryItem.platform,
        startedAt: params.libraryItem.startedAt,
        completedAt: params.libraryItem.completedAt,
        ...(isPlayed && { hasBeenPlayed: true }),
      },
    });
  }

  async setRating(params: {
    libraryItemId: number;
    userId: string;
    rating: number | null;
  }): Promise<void> {
    await libraryRepositorySetRating(params);
  }

  async getRatingHistogram(params: {
    userId: string;
  }): Promise<Array<{ rating: number; count: number }>> {
    return getRatingHistogram(params);
  }

  async getRandomWishlistGame(params: { userId: string }): Promise<{
    id: string;
    igdbId: number;
    title: string;
    slug: string;
    coverImage: string | null;
  } | null> {
    const items = await findWishlistItemsForUser({
      userId: params.userId,
    });

    if (items.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * items.length);
    const randomItem = items[randomIndex];

    return {
      id: randomItem.game.id,
      igdbId: randomItem.game.igdbId,
      title: randomItem.game.title,
      slug: randomItem.game.slug,
      coverImage: randomItem.game.coverImage,
    };
  }
}
