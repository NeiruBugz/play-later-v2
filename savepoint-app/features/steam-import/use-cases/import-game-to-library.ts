"use server";

import {
  AcquisitionType,
  LibraryItemStatus,
  type LibraryItemDomain,
} from "@/data-access-layer/domain/library";
import {
  findGameByIgdbId,
  findImportedGameById,
  updateImportedGameStatus,
} from "@/data-access-layer/repository";
import {
  GameDetailService,
  IgdbService,
  LibraryService,
  ServiceErrorCode,
} from "@/data-access-layer/services";
import { matchSteamGameToIgdb } from "@/data-access-layer/services/igdb/igdb-matcher";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import type { LibraryStatus } from "../types";

const logger = createLogger({
  [LOGGER_CONTEXT.USE_CASE]: "importGameToLibrary",
});

const LIBRARY_STATUS_MAP: Record<LibraryStatus, LibraryItemStatus> = {
  want_to_play: LibraryItemStatus.WANT_TO_PLAY,
  owned: LibraryItemStatus.OWNED,
  playing: LibraryItemStatus.PLAYING,
  played: LibraryItemStatus.PLAYED,
};

type ImportGameToLibraryInput = {
  importedGameId: string;
  userId: string;
  status: LibraryStatus;
  manualIgdbId?: number;
};

type ImportGameToLibraryResult =
  | {
      success: true;
      data: { libraryItem: LibraryItemDomain; gameSlug: string };
    }
  | {
      success: false;
      error: string;
      errorCode:
        | "NOT_FOUND"
        | "NO_MATCH"
        | "DUPLICATE"
        | "IGDB_ERROR"
        | "NETWORK_ERROR";
    };

export async function importGameToLibrary(
  input: ImportGameToLibraryInput
): Promise<ImportGameToLibraryResult> {
  const { importedGameId, userId, status, manualIgdbId } = input;

  logger.info(
    { importedGameId, userId, status, manualIgdbId },
    "Starting game import to library"
  );

  const importedGameResult = await findImportedGameById(importedGameId, userId);
  if (!importedGameResult.success) {
    logger.error(
      { error: importedGameResult.error, importedGameId, userId },
      "Failed to fetch imported game"
    );
    return {
      success: false,
      error: "Failed to fetch imported game",
      errorCode: "NOT_FOUND",
    };
  }

  const importedGame = importedGameResult.data;
  if (!importedGame) {
    logger.warn({ importedGameId, userId }, "Imported game not found");
    return {
      success: false,
      error: "Imported game not found or access denied",
      errorCode: "NOT_FOUND",
    };
  }

  let igdbId: number;
  let igdbGameData:
    | Extract<
        Awaited<ReturnType<IgdbService["getGameDetails"]>>,
        { success: true }
      >["data"]
    | null = null;

  if (manualIgdbId) {
    logger.info(
      { importedGameId, manualIgdbId },
      "Using manually selected IGDB ID"
    );
    igdbId = manualIgdbId;
  } else {
    logger.info(
      { importedGameId, steamAppId: importedGame.storefrontGameId },
      "Auto-matching Steam game to IGDB"
    );

    if (!importedGame.storefrontGameId) {
      logger.error(
        { importedGameId },
        "Cannot auto-match: missing storefrontGameId"
      );
      const updateStatusResult = await updateImportedGameStatus(
        importedGameId,
        userId,
        "UNMATCHED"
      );
      if (!updateStatusResult.success) {
        logger.error(
          { error: updateStatusResult.error, importedGameId },
          "Failed to update status to UNMATCHED"
        );
      }
      return {
        success: false,
        error: "Cannot match game without Steam App ID",
        errorCode: "NO_MATCH",
      };
    }

    const matchResult = await matchSteamGameToIgdb({
      steamAppId: importedGame.storefrontGameId,
    });

    if (!matchResult.success) {
      const isNetworkError =
        matchResult.code === ServiceErrorCode.EXTERNAL_SERVICE_ERROR ||
        matchResult.code === ServiceErrorCode.IGDB_RATE_LIMITED;

      if (isNetworkError) {
        logger.warn(
          {
            error: matchResult.error,
            errorCode: matchResult.code,
            importedGameId,
          },
          "Network error during Steam to IGDB matching - game stays PENDING for retry"
        );
        return {
          success: false,
          error:
            matchResult.error || "Network error occurred. Please try again.",
          errorCode: "NETWORK_ERROR",
        };
      }

      logger.error(
        { error: matchResult.error, importedGameId },
        "Steam to IGDB matching failed"
      );
      const updateStatusResult = await updateImportedGameStatus(
        importedGameId,
        userId,
        "UNMATCHED"
      );
      if (!updateStatusResult.success) {
        logger.error(
          { error: updateStatusResult.error, importedGameId },
          "Failed to update status to UNMATCHED"
        );
      }
      return {
        success: false,
        error: matchResult.error || "IGDB matching failed",
        errorCode: "IGDB_ERROR",
      };
    }

    if (!matchResult.data.game) {
      logger.warn(
        { importedGameId, steamAppId: importedGame.storefrontGameId },
        "No IGDB match found for Steam game"
      );
      const updateStatusResult = await updateImportedGameStatus(
        importedGameId,
        userId,
        "UNMATCHED"
      );
      if (!updateStatusResult.success) {
        logger.error(
          { error: updateStatusResult.error, importedGameId },
          "Failed to update status to UNMATCHED"
        );
      }
      return {
        success: false,
        error: "No IGDB match found for this Steam game",
        errorCode: "NO_MATCH",
      };
    }

    igdbId = matchResult.data.game.id;
    igdbGameData = { game: matchResult.data.game };
    logger.info(
      { importedGameId, igdbId, gameName: matchResult.data.game.name },
      "Successfully matched Steam game to IGDB"
    );
  }

  const gameResult = await findGameByIgdbId(igdbId);
  if (!gameResult.success) {
    logger.error(
      { error: gameResult.error, igdbId },
      "Failed to check if game exists in database"
    );
    return {
      success: false,
      error: "Failed to check game existence",
      errorCode: "IGDB_ERROR",
    };
  }

  let gameId: string;
  let gameSlug: string;

  if (gameResult.data) {
    gameId = gameResult.data.id;
    gameSlug = gameResult.data.slug;
    logger.info(
      { gameId, igdbId, slug: gameSlug },
      "Game already exists in database"
    );
  } else {
    logger.info({ igdbId }, "Game not in database, fetching from IGDB");

    if (!igdbGameData) {
      const igdbService = new IgdbService();
      const igdbDetailsResult = await igdbService.getGameDetails({
        gameId: igdbId,
      });

      if (!igdbDetailsResult.success) {
        logger.error(
          { error: igdbDetailsResult.error, igdbId },
          "Failed to fetch game details from IGDB"
        );
        return {
          success: false,
          error: "Failed to fetch game details from IGDB",
          errorCode: "IGDB_ERROR",
        };
      }

      igdbGameData = igdbDetailsResult.data;
    }

    if (!igdbGameData || !igdbGameData.game) {
      logger.error({ igdbId }, "No game data returned from IGDB");
      return {
        success: false,
        error: "Game not found in IGDB",
        errorCode: "IGDB_ERROR",
      };
    }

    const gameDetailService = new GameDetailService();
    const populateResult = await gameDetailService.populateGameInDatabase(
      igdbGameData.game
    );

    if (!populateResult.success) {
      logger.error(
        { error: populateResult.error, igdbId },
        "Failed to populate game in database"
      );
      return {
        success: false,
        error: "Failed to create game record",
        errorCode: "IGDB_ERROR",
      };
    }

    if (!populateResult.data) {
      logger.error({ igdbId }, "Game population returned no data");
      return {
        success: false,
        error: "Failed to create game record",
        errorCode: "IGDB_ERROR",
      };
    }

    gameId = populateResult.data.id;
    gameSlug = populateResult.data.slug;
    logger.info(
      { gameId, igdbId, slug: gameSlug },
      "Successfully created game in database"
    );
  }

  const libraryService = new LibraryService();
  const existingItemsResult = await libraryService.findAllLibraryItemsByGameId({
    userId,
    gameId,
  });

  if (
    existingItemsResult.success &&
    existingItemsResult.data &&
    existingItemsResult.data.length > 0
  ) {
    logger.warn(
      { userId, gameId, existingCount: existingItemsResult.data.length },
      "Game already in user library (marking as MATCHED)"
    );

    const updateStatusResult = await updateImportedGameStatus(
      importedGameId,
      userId,
      "MATCHED"
    );
    if (!updateStatusResult.success) {
      logger.error(
        { error: updateStatusResult.error, importedGameId },
        "Failed to update imported game status to MATCHED"
      );
    }

    return {
      success: false,
      error: "Game already in library",
      errorCode: "DUPLICATE",
    };
  }

  const createResult = await libraryService.createLibraryItem({
    userId,
    gameId,
    libraryItem: {
      status: LIBRARY_STATUS_MAP[status],
      acquisitionType: AcquisitionType.DIGITAL,
      platform: "PC (Microsoft Windows)",
    },
  });

  if (!createResult.success) {
    logger.error(
      { error: createResult.error, userId, gameId },
      "Failed to create library item"
    );
    return {
      success: false,
      error: createResult.error || "Failed to create library item",
      errorCode: "IGDB_ERROR",
    };
  }

  const updateStatusResult = await updateImportedGameStatus(
    importedGameId,
    userId,
    "MATCHED"
  );
  if (!updateStatusResult.success) {
    logger.error(
      { error: updateStatusResult.error, importedGameId },
      "Failed to update imported game status to MATCHED"
    );
  }

  logger.info(
    {
      importedGameId,
      gameId,
      libraryItemId: createResult.data.id,
      gameSlug,
    },
    "Successfully imported game to library"
  );

  return {
    success: true,
    data: {
      libraryItem: createResult.data,
      gameSlug,
    },
  };
}
