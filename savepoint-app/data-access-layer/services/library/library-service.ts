import "server-only";

import {
  createLibraryItem,
  deleteLibraryItem,
  DuplicateError,
  findAllLibraryItemsByGameId,
  findGameByIgdbId,
  findLibraryItemById,
  findLibraryItemsWithFilters,
  findMostRecentLibraryItemByGameId,
  findMostRecentPlayingGame,
  findWishlistItemsForUser,
  setRating as libraryRepositorySetRating,
  NotFoundError,
  updateLibraryItem,
  type FindLibraryItemsResult,
} from "@/data-access-layer/repository";
import {
  AcquisitionType,
  LibraryItemStatus,
  type LibraryItem,
} from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import {
  handleServiceError,
  serviceError,
  ServiceErrorCode,
  serviceSuccess,
  type ServiceResult,
} from "../types";
import {
  DeleteLibraryItemSchema,
  GetLibraryItemsServiceSchema,
  SetRatingSchema,
} from "./schemas";

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
    try {
      const game = await findGameByIgdbId(igdbId);
      return serviceSuccess(game);
    } catch (error) {
      return handleServiceError(error, "Failed to find game by IGDB ID");
    }
  }

  async getMostRecentPlayingGame(params: { userId: string }): Promise<
    ServiceResult<{
      gameId: string;
      igdbId: number;
      name: string;
      coverImageId: string | null;
    } | null>
  > {
    try {
      const data = await findMostRecentPlayingGame(params);

      if (!data) {
        return serviceSuccess(null);
      }

      const game = {
        gameId: data.game.id,
        igdbId: data.game.igdbId,
        name: data.game.title,
        coverImageId: data.game.coverImage,
      };

      return serviceSuccess(game);
    } catch (error) {
      return handleServiceError(
        error,
        "Failed to get most recent playing game"
      );
    }
  }
  async findMostRecentLibraryItemByGameId(params: {
    userId: string;
    gameId: string;
  }): Promise<ServiceResult<LibraryItem | null>> {
    try {
      const data = await findMostRecentLibraryItemByGameId(params);
      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(
        error,
        "Failed to find most recent library item"
      );
    }
  }
  async updateLibraryItem(params: {
    userId: string;
    libraryItem: {
      id: number;
      status: LibraryItemStatus;
      startedAt?: Date;
      completedAt?: Date;
      statusChangedAt?: Date;
    };
  }) {
    try {
      const existingItem = await findLibraryItemById({
        libraryItemId: params.libraryItem.id,
        userId: params.userId,
      });
      const statusChanged = params.libraryItem.status !== existingItem.status;
      const isTransitioningToPlayed =
        params.libraryItem.status === LibraryItemStatus.PLAYED;
      const data = await updateLibraryItem({
        userId: params.userId,
        libraryItem: {
          id: params.libraryItem.id,
          status: params.libraryItem.status,
          startedAt: params.libraryItem.startedAt,
          completedAt: params.libraryItem.completedAt,
          statusChangedAt:
            params.libraryItem.statusChangedAt ??
            (statusChanged ? new Date() : undefined),
          ...(isTransitioningToPlayed && { hasBeenPlayed: true }),
        },
      });
      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(error, "Failed to update library item");
    }
  }
  async findAllLibraryItemsByGameId(params: {
    userId: string;
    gameId: string;
  }): Promise<ServiceResult<LibraryItem[]>> {
    try {
      const data = await findAllLibraryItemsByGameId(params);
      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(error, "Failed to find all library items");
    }
  }
  async getLibraryItems(
    params: GetLibraryItemsParams
  ): Promise<
    | { success: true; data: GetLibraryItemsResult }
    | { success: false; error: string }
  > {
    try {
      const validation = GetLibraryItemsServiceSchema.safeParse(params);
      if (!validation.success) {
        this.logger.warn(
          { errors: validation.error.issues },
          "Invalid input parameters"
        );
        return serviceError(
          validation.error.issues[0]?.message ?? "Invalid input parameters"
        );
      }

      const { offset, limit, ...restParams } = validation.data;

      if (restParams.unratedOnly) {
        restParams.minRating = undefined;
      }

      const data = await findLibraryItemsWithFilters({
        ...restParams,
        skip: offset,
        take: limit,
      });

      const currentOffset = offset ?? 0;
      const hasMore = currentOffset + data.items.length < data.total;

      return serviceSuccess({
        items: data.items,
        total: data.total,
        hasMore,
      });
    } catch (error) {
      return handleServiceError(error, "Failed to get library items");
    }
  }
  async deleteLibraryItem(params: {
    libraryItemId: number;
    userId: string;
  }): Promise<ServiceResult<void>> {
    try {
      const validation = DeleteLibraryItemSchema.safeParse(params);
      if (!validation.success) {
        this.logger.warn(
          { errors: validation.error.issues },
          "Invalid input parameters"
        );
        return serviceError(
          validation.error.issues[0]?.message ?? "Invalid input parameters"
        );
      }
      try {
        await deleteLibraryItem({
          libraryItemId: params.libraryItemId,
          userId: params.userId,
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          this.logger.warn(
            { libraryItemId: params.libraryItemId, userId: params.userId },
            "Library item not found or unauthorized delete attempt"
          );
          return serviceError(
            "Library item not found or you do not have permission to delete it"
          );
        }
        throw error;
      }
      return serviceSuccess(undefined);
    } catch (error) {
      return handleServiceError(error, "Failed to delete library item");
    }
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
  }) {
    try {
      const isPlayed = params.libraryItem.status === LibraryItemStatus.PLAYED;
      try {
        const data = await createLibraryItem({
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
        return serviceSuccess(data);
      } catch (error) {
        if (error instanceof DuplicateError) {
          this.logger.warn(
            { userId: params.userId, gameId: params.gameId },
            "Duplicate library item attempted"
          );
          return serviceError("Game already in library");
        }
        throw error;
      }
    } catch (error) {
      return handleServiceError(error, "Failed to create library item");
    }
  }

  async setRating(params: {
    libraryItemId: number;
    userId: string;
    rating: number | null;
  }): Promise<ServiceResult<void>> {
    try {
      const validation = SetRatingSchema.safeParse(params);
      if (!validation.success) {
        this.logger.warn(
          { errors: validation.error.issues },
          "Invalid rating input"
        );
        return serviceError(
          validation.error.issues[0]?.message ?? "Invalid rating",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }
      const result = await libraryRepositorySetRating(validation.data);
      if (!result.ok) {
        this.logger.warn(
          { libraryItemId: params.libraryItemId, userId: params.userId },
          "Library item not found or unauthorized rating attempt"
        );
        return serviceError(result.error.message, ServiceErrorCode.NOT_FOUND);
      }
      return serviceSuccess(undefined);
    } catch (error) {
      return handleServiceError(error, "Failed to set rating");
    }
  }

  async getRandomWishlistGame(params: { userId: string }): Promise<
    ServiceResult<{
      id: string;
      igdbId: number;
      title: string;
      slug: string;
      coverImage: string | null;
    } | null>
  > {
    try {
      const items = await findWishlistItemsForUser({
        userId: params.userId,
      });

      if (items.length === 0) {
        return serviceSuccess(null);
      }

      const randomIndex = Math.floor(Math.random() * items.length);
      const randomItem = items[randomIndex];

      return serviceSuccess({
        id: randomItem.game.id,
        igdbId: randomItem.game.igdbId,
        title: randomItem.game.title,
        slug: randomItem.game.slug,
        coverImage: randomItem.game.coverImage,
      });
    } catch (error) {
      return handleServiceError(error, "Failed to get random wishlist game");
    }
  }
}
