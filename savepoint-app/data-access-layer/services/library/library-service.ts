import "server-only";

import {
  createLibraryItem,
  deleteLibraryItem,
  findAllLibraryItemsByGameId,
  findGameByIgdbId,
  findLibraryItemById,
  findLibraryItemsWithFilters,
  findMostRecentLibraryItemByGameId,
  findUserById,
  updateLibraryItem,
} from "@/data-access-layer/repository";
import { populateGameInDatabase } from "@/data-access-layer/services/game-detail/game-detail-service";
import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";
import { AcquisitionType, LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, type ServiceResult } from "../types";
import type {
  AddGameToLibraryInput,
  AddGameToLibraryResult,
  LibraryService as ILibraryService,
} from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "LibraryService" });

/**
 * Zod schema for getLibraryItems input validation
 */
const GetLibraryItemsSchema = z.object({
  userId: z.string().cuid(),
  status: z.nativeEnum(LibraryItemStatus).optional(),
  platform: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "releaseDate", "startedAt", "completedAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  distinctByGame: z.boolean().optional(),
});

/**
 * Zod schema for deleteLibraryItem input validation
 */
const DeleteLibraryItemSchema = z.object({
  libraryItemId: z.number().int().positive(),
  userId: z.string().cuid(),
});

type SortField = "createdAt" | "releaseDate" | "startedAt" | "completedAt";

type GetLibraryItemsParams = {
  userId: string;
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy?: SortField;
  sortOrder?: "asc" | "desc";
  distinctByGame?: boolean;
};

type LibraryItemWithGameAndCount = {
  id: number;
  userId: string;
  gameId: string;
  status: LibraryItemStatus;
  platform: string | null;
  acquisitionType: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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

export class LibraryService extends BaseService implements ILibraryService {
  async addGameToLibrary(
    input: AddGameToLibraryInput
  ): Promise<AddGameToLibraryResult> {
    try {
      const { userId, igdbId, status, platform, startedAt, completedAt } =
        input;

      logger.info({ userId, igdbId, status }, "Adding game to library");

      const userResult = await findUserById(userId, { select: { id: true } });
      if (!userResult.ok) {
        logger.error(
          { userId, error: userResult.error },
          "Failed to verify user existence"
        );
        return this.error("Failed to verify user account");
      }

      if (!userResult.data) {
        logger.error({ userId }, "User record not found in database");
        return this.error(
          "User account not found. Please sign out and sign in again to refresh your session."
        );
      }

      let gameResult = await findGameByIgdbId(igdbId);

      if (!gameResult.ok || !gameResult.data) {
        logger.info(
          { igdbId },
          "Game not in database, fetching from IGDB and populating"
        );

        const igdbService = new IgdbService();
        const igdbGameResult = await igdbService.getGameDetails({
          gameId: igdbId,
        });

        if (!igdbGameResult.success) {
          logger.error(
            { igdbId, error: igdbGameResult.error },
            "Failed to fetch game from IGDB"
          );
          return this.error("Failed to fetch game details from IGDB");
        }

        if (!igdbGameResult.data.game) {
          logger.error({ igdbId }, "Game not found in IGDB");
          return this.error("Game not found in IGDB");
        }

        await populateGameInDatabase(igdbGameResult.data.game);

        gameResult = await findGameByIgdbId(igdbId);
        if (!gameResult.ok || !gameResult.data) {
          logger.error({ igdbId }, "Game still not found after population");
          return this.error("Failed to save game to database");
        }
      }

      const libraryItemResult = await createLibraryItem({
        userId,
        gameId: gameResult.data.id,
        libraryItem: {
          status,
          acquisitionType: AcquisitionType.DIGITAL, // Default to DIGITAL
          platform: platform ?? undefined,
          startedAt: startedAt ?? undefined,
          completedAt: completedAt ?? undefined,
        },
      });

      if (!libraryItemResult.ok) {
        logger.error(
          {
            error: libraryItemResult.error,
            userId,
            gameId: gameResult.data.id,
          },
          "Failed to create library item"
        );

        if (libraryItemResult.error.code === "DUPLICATE") {
          return this.error("This game is already in your library");
        }

        return this.error("Failed to add game to library");
      }

      logger.info(
        {
          userId,
          gameId: gameResult.data.id,
          libraryItemId: libraryItemResult.data.id,
          status,
        },
        "Game added to library successfully"
      );

      return this.success({
        libraryItem: libraryItemResult.data,
        gameSlug: gameResult.data.slug,
      });
    } catch (error) {
      logger.error({ error, input }, "Unexpected error in addGameToLibrary");
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  /**
   * Find a game by IGDB ID
   */
  async findGameByIgdbId(igdbId: number) {
    try {
      logger.info({ igdbId }, "Finding game by IGDB ID");
      const result = await findGameByIgdbId(igdbId);

      if (!result.ok) {
        logger.error({ error: result.error, igdbId }, "Failed to find game");
        return this.error("Failed to find game");
      }

      return this.success(result.data);
    } catch (error) {
      logger.error({ error, igdbId }, "Unexpected error in findGameByIgdbId");
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  /**
   * Find the most recent library item for a game
   */
  async findMostRecentLibraryItemByGameId(params: {
    userId: string;
    gameId: string;
  }) {
    try {
      logger.info(params, "Finding most recent library item");
      const result = await findMostRecentLibraryItemByGameId(params);

      if (!result.ok) {
        logger.error(
          { error: result.error, ...params },
          "Failed to find library item"
        );
        return this.error("Failed to find library item");
      }

      return this.success(result.data);
    } catch (error) {
      logger.error(
        { error, ...params },
        "Unexpected error in findMostRecentLibraryItemByGameId"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  /**
   * Validate status transition for library items
   *
   * Rule: Cannot move TO Wishlist from any other status
   * All other transitions are allowed (forward progression is flexible)
   */
  private validateStatusTransition(
    currentStatus: LibraryItemStatus,
    newStatus: LibraryItemStatus
  ): { valid: boolean; error?: string } {
    // Rule: Cannot move TO Wishlist from any other status
    if (
      newStatus === LibraryItemStatus.WISHLIST &&
      currentStatus !== LibraryItemStatus.WISHLIST
    ) {
      return {
        valid: false,
        error:
          "Cannot move a game back to Wishlist. Create a new library item instead.",
      };
    }

    // All other transitions are allowed (forward progression is flexible)
    return { valid: true };
  }

  /**
   * Update a library item
   */
  async updateLibraryItem(params: {
    userId: string;
    libraryItem: {
      id: number;
      status: LibraryItemStatus;
      startedAt?: Date;
      completedAt?: Date;
    };
  }) {
    try {
      logger.info(params, "Updating library item");

      const currentItemResult = await findLibraryItemById({
        libraryItemId: params.libraryItem.id,
        userId: params.userId,
      });

      if (!currentItemResult.ok) {
        logger.error(
          { error: currentItemResult.error, ...params },
          "Failed to fetch library item for update"
        );
        return this.error("Library item not found");
      }

      const currentStatus = currentItemResult.data.status;
      const newStatus = params.libraryItem.status;

      if (newStatus !== currentStatus) {
        const transitionValidation = this.validateStatusTransition(
          currentStatus,
          newStatus
        );

        if (!transitionValidation.valid) {
          logger.warn(
            {
              libraryItemId: params.libraryItem.id,
              currentStatus,
              requestedStatus: newStatus,
            },
            "Invalid status transition attempted"
          );
          return this.error(
            transitionValidation.error ?? "Invalid status transition"
          );
        }
      }

      const result = await updateLibraryItem(params);

      if (!result.ok) {
        logger.error(
          { error: result.error, ...params },
          "Failed to update library item"
        );
        return this.error("Failed to update library item");
      }

      logger.info(
        {
          libraryItemId: params.libraryItem.id,
          oldStatus: currentStatus,
          newStatus,
        },
        "Library item updated successfully"
      );

      return this.success(result.data);
    } catch (error) {
      logger.error(
        { error, ...params },
        "Unexpected error in updateLibraryItem"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  /**
   * Find all library items for a game
   */
  async findAllLibraryItemsByGameId(params: {
    userId: string;
    gameId: string;
  }) {
    try {
      logger.info(params, "Finding all library items for game");
      const result = await findAllLibraryItemsByGameId(params);

      if (!result.ok) {
        logger.error(
          { error: result.error, ...params },
          "Failed to find library items"
        );
        return this.error("Failed to find library items");
      }

      return this.success(result.data);
    } catch (error) {
      logger.error(
        { error, ...params },
        "Unexpected error in findAllLibraryItemsByGameId"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  /**
   * Get library items with filtering, sorting, and search capabilities
   *
   * This service method:
   * 1. Validates input parameters using Zod schema
   * 2. Calls the repository to fetch filtered library items
   * 3. Returns structured ServiceResult with data or error
   */
  async getLibraryItems(
    params: GetLibraryItemsParams
  ): Promise<
    | { success: true; data: LibraryItemWithGameAndCount[] }
    | { success: false; error: string }
  > {
    try {
      logger.info({ userId: params.userId }, "Fetching library items");

      const validation = GetLibraryItemsSchema.safeParse(params);
      if (!validation.success) {
        logger.warn(
          { errors: validation.error.errors },
          "Invalid input parameters"
        );
        return this.error(
          validation.error.errors[0]?.message ?? "Invalid input parameters"
        );
      }

      const result = await findLibraryItemsWithFilters(validation.data);

      if (!result.ok) {
        logger.error(
          { error: result.error, userId: params.userId },
          "Failed to fetch library items"
        );
        return this.error("Failed to fetch library items");
      }

      logger.info(
        { count: result.data.length, userId: params.userId },
        "Library items fetched successfully"
      );
      return this.success(result.data);
    } catch (error) {
      logger.error({ error, ...params }, "Unexpected error in getLibraryItems");
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  async deleteLibraryItem(params: {
    libraryItemId: number;
    userId: string;
  }): Promise<ServiceResult<void>> {
    try {
      logger.info(
        { libraryItemId: params.libraryItemId, userId: params.userId },
        "Attempting to delete library item"
      );

      const validation = DeleteLibraryItemSchema.safeParse(params);
      if (!validation.success) {
        logger.warn(
          { errors: validation.error.errors },
          "Invalid input parameters"
        );
        return this.error(
          validation.error.errors[0]?.message ?? "Invalid input parameters"
        );
      }

      const deleteResult = await deleteLibraryItem({
        libraryItemId: params.libraryItemId,
        userId: params.userId,
      });

      if (!deleteResult.ok) {
        if (deleteResult.error.code === "NOT_FOUND") {
          logger.warn(
            { libraryItemId: params.libraryItemId, userId: params.userId },
            "Library item not found or unauthorized delete attempt"
          );
          return this.error(
            "Library item not found or you do not have permission to delete it"
          );
        }

        logger.error(
          { error: deleteResult.error },
          "Failed to delete library item"
        );
        return this.error("Failed to delete library item");
      }

      logger.info(
        { libraryItemId: params.libraryItemId },
        "Library item deleted successfully"
      );
      return this.success(undefined);
    } catch (error) {
      logger.error(
        { error, ...params },
        "Unexpected error in deleteLibraryItem"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
}
