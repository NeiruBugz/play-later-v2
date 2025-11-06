import "server-only";

import {
  createLibraryItem,
  findAllLibraryItemsByGameId,
  findGameByIgdbId,
  findMostRecentLibraryItemByGameId,
  findUserById,
  updateLibraryItem,
} from "@/data-access-layer/repository";
import { populateGameInDatabase } from "@/data-access-layer/services/game-detail/game-detail-service";
import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";
import { AcquisitionType, LibraryItemStatus } from "@prisma/client";

import { createLogger } from "@/shared/lib/app/logger";
import { LOGGER_CONTEXT } from "@/shared/lib/app/logger-context";

import { BaseService } from "../types";
import type {
  AddGameToLibraryInput,
  AddGameToLibraryResult,
  LibraryService as ILibraryService,
} from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "LibraryService" });

export class LibraryService extends BaseService implements ILibraryService {
  /**
   * Add a game to a user's library
   *
   * This service method:
   * 1. Verifies the user exists in the database
   * 2. Checks if the game exists in the database (by IGDB ID)
   * 3. If game doesn't exist, fetches from IGDB and populates the database
   * 4. Creates a library item for the user
   */
  async addGameToLibrary(
    input: AddGameToLibraryInput
  ): Promise<AddGameToLibraryResult> {
    try {
      const { userId, igdbId, status, platform } = input;

      logger.info({ userId, igdbId, status }, "Adding game to library");

      // 1. Verify user exists in database
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

      // 2. Check if game exists in database
      let gameResult = await findGameByIgdbId(igdbId);

      // 3. If game doesn't exist, fetch from IGDB and populate database
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

        // Populate database synchronously
        await populateGameInDatabase(igdbGameResult.data.game);

        // Re-fetch to get the database record
        gameResult = await findGameByIgdbId(igdbId);
        if (!gameResult.ok || !gameResult.data) {
          logger.error({ igdbId }, "Game still not found after population");
          return this.error("Failed to save game to database");
        }
      }

      // 4. Create library item
      const libraryItemResult = await createLibraryItem({
        userId,
        gameId: gameResult.data.id,
        libraryItem: {
          status,
          acquisitionType: AcquisitionType.DIGITAL, // Default to DIGITAL
          platform: platform ?? undefined,
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

        // Handle duplicate error
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
   * Update a library item
   */
  async updateLibraryItem(params: {
    userId: string;
    libraryItem: { id: number; status: LibraryItemStatus };
  }) {
    try {
      logger.info(params, "Updating library item");
      const result = await updateLibraryItem(params);

      if (!result.ok) {
        logger.error(
          { error: result.error, ...params },
          "Failed to update library item"
        );
        return this.error("Failed to update library item");
      }

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
}
