"use server";

import { GameDetailService } from "@/data-access-layer/services/game-detail/game-detail-service";
import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";
import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import {
  AcquisitionType,
  type LibraryItemDomain,
  type LibraryItemStatus,
} from "@/shared/types";

const logger = createLogger({
  [LOGGER_CONTEXT.USE_CASE]: "addGameToLibraryUseCase",
});
export type AddGameToLibraryInput = {
  userId: string;
  igdbId: number;
  status: LibraryItemStatus;
  platform?: string;
  startedAt?: Date;
  completedAt?: Date;
};
export type AddGameToLibraryResult =
  | {
      success: true;
      data: {
        libraryItem: LibraryItemDomain;
        gameSlug: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function addGameToLibrary(
  input: AddGameToLibraryInput
): Promise<AddGameToLibraryResult> {
  try {
    const { userId, igdbId, status, platform, startedAt, completedAt } = input;
    logger.info({ userId, igdbId, status }, "Use case: Adding game to library");
    const profileService = new ProfileService();
    const userResult = await profileService.verifyUserExists({ userId });
    if (!userResult.success) {
      logger.error(
        { userId, error: userResult.error },
        "Failed to verify user existence"
      );
      return {
        success: false,
        error: userResult.error,
      };
    }
    const libraryService = new LibraryService();
    let gameResult = await libraryService.findGameByIgdbId(igdbId);
    if (!gameResult.success || !gameResult.data) {
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
        return {
          success: false,
          error: "Failed to fetch game details from IGDB",
        };
      }
      if (!igdbGameResult.data.game) {
        logger.error({ igdbId }, "Game not found in IGDB");
        return {
          success: false,
          error: "Game not found in IGDB",
        };
      }
      const gameDetailService = new GameDetailService();
      const populateResult = await gameDetailService.populateGameInDatabase(
        igdbGameResult.data.game
      );
      if (!populateResult.success) {
        logger.error(
          { igdbId, error: populateResult.error },
          "Failed to populate game in database"
        );
        return {
          success: false,
          error: "Failed to save game to database",
        };
      }
      gameResult = await libraryService.findGameByIgdbId(igdbId);
      if (!gameResult.success || !gameResult.data) {
        logger.error({ igdbId }, "Game still not found after population");
        return {
          success: false,
          error: "Failed to save game to database",
        };
      }
    }
    const existingItemsResult =
      await libraryService.findAllLibraryItemsByGameId({
        userId,
        gameId: gameResult.data.id,
      });
    if (existingItemsResult.success && existingItemsResult.data) {
      const exactDuplicate = existingItemsResult.data.find(
        (item) =>
          item.status === status &&
          (item.platform === platform ||
            (item.platform === null && platform === undefined))
      );
      if (exactDuplicate) {
        logger.warn(
          { userId, gameId: gameResult.data.id, status, platform },
          "Attempted to add duplicate game to library"
        );
        return {
          success: false,
          error: "This game is already in your library",
        };
      }
    }
    const libraryItemResult = await libraryService.createLibraryItem({
      userId,
      gameId: gameResult.data.id,
      libraryItem: {
        status,
        acquisitionType: AcquisitionType.DIGITAL,
        platform: platform ?? undefined,
        startedAt: startedAt ?? undefined,
        completedAt: completedAt ?? undefined,
      },
    });
    if (!libraryItemResult.success) {
      logger.error(
        {
          error: libraryItemResult.error,
          userId,
          gameId: gameResult.data.id,
        },
        "Failed to create library item"
      );
      return {
        success: false,
        error: libraryItemResult.error,
      };
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
    return {
      success: true,
      data: {
        libraryItem: libraryItemResult.data,
        gameSlug: gameResult.data.slug,
      },
    };
  } catch (error) {
    logger.error({ error, input }, "Use case failed: Add game to library");
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
