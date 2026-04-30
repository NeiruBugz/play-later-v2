"use server";

import {
  GameDetailService,
  getGameByIgdbId,
  IgdbService,
  ImportedGameService,
  LibraryService,
} from "@/data-access-layer/services";
import { IgdbRateLimitError } from "@/data-access-layer/services/igdb/errors";
import { matchSteamGameToIgdb } from "@/data-access-layer/services/igdb/igdb-matcher";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { ExternalServiceError } from "@/shared/lib/errors";
import {
  AcquisitionType,
  LibraryItemStatus,
  type LibraryItem,
} from "@/shared/types";

import type { LibraryStatus } from "../types";

const logger = createLogger({
  [LOGGER_CONTEXT.USE_CASE]: "importGameToLibrary",
});

const LIBRARY_STATUS_MAP: Record<LibraryStatus, LibraryItemStatus> = {
  wishlist: LibraryItemStatus.WISHLIST,
  shelf: LibraryItemStatus.SHELF,
  up_next: LibraryItemStatus.UP_NEXT,
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
      data: { libraryItem: LibraryItem; gameSlug: string };
    }
  | {
      success: false;
      error: string;
    };

async function tryUpdateStatus(
  importedGameService: ImportedGameService,
  importedGameId: string,
  userId: string,
  status: "UNMATCHED" | "MATCHED" | "IGNORED" | "PENDING"
): Promise<void> {
  try {
    await importedGameService.updateStatus({
      id: importedGameId,
      userId,
      status,
    });
  } catch (error) {
    logger.error(
      { error, importedGameId, status },
      "Failed to update imported game status"
    );
  }
}

export async function importGameToLibrary(
  input: ImportGameToLibraryInput
): Promise<ImportGameToLibraryResult> {
  const { importedGameId, userId, status, manualIgdbId } = input;

  logger.info(
    { importedGameId, userId, status, manualIgdbId },
    "Starting game import to library"
  );

  const importedGameService = new ImportedGameService();
  const importedGame = await importedGameService.findById({
    id: importedGameId,
    userId,
  });

  if (!importedGame) {
    logger.warn({ importedGameId, userId }, "Imported game not found");
    return {
      success: false,
      error: "Imported game not found or access denied",
    };
  }

  let igdbId: number;
  let igdbGameData: {
    game: Awaited<ReturnType<IgdbService["getGameDetails"]>>["game"];
  } | null = null;

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
      await tryUpdateStatus(
        importedGameService,
        importedGameId,
        userId,
        "UNMATCHED"
      );
      return {
        success: false,
        error: "Cannot match game without Steam App ID",
      };
    }

    let matchResult: Awaited<ReturnType<typeof matchSteamGameToIgdb>>;
    try {
      matchResult = await matchSteamGameToIgdb({
        steamAppId: importedGame.storefrontGameId,
      });
    } catch (error) {
      const isRetryable =
        error instanceof IgdbRateLimitError ||
        error instanceof ExternalServiceError;

      if (isRetryable) {
        logger.warn(
          {
            error,
            importedGameId,
          },
          "Network error during Steam to IGDB matching - game stays PENDING for retry"
        );
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Network error occurred. Please try again.",
        };
      }

      logger.error({ error, importedGameId }, "Steam to IGDB matching failed");
      await tryUpdateStatus(
        importedGameService,
        importedGameId,
        userId,
        "UNMATCHED"
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "IGDB matching failed",
      };
    }

    if (!matchResult.game) {
      logger.warn(
        { importedGameId, steamAppId: importedGame.storefrontGameId },
        "No IGDB match found for Steam game"
      );
      await tryUpdateStatus(
        importedGameService,
        importedGameId,
        userId,
        "UNMATCHED"
      );
      return {
        success: false,
        error: "No IGDB match found for this Steam game",
      };
    }

    igdbId = matchResult.game.id;
    igdbGameData = { game: matchResult.game };
    logger.info(
      { importedGameId, igdbId, gameName: matchResult.game.name },
      "Successfully matched Steam game to IGDB"
    );
  }

  const game = await getGameByIgdbId(igdbId);

  let gameId: string;
  let gameSlug: string;

  if (game) {
    gameId = game.id;
    gameSlug = game.slug;
    logger.info(
      { gameId, igdbId, slug: gameSlug },
      "Game already exists in database"
    );
  } else {
    logger.info({ igdbId }, "Game not in database, fetching from IGDB");

    if (!igdbGameData) {
      const igdbService = new IgdbService();
      let igdbDetails: Awaited<ReturnType<IgdbService["getGameDetails"]>>;
      try {
        igdbDetails = await igdbService.getGameDetails({
          gameId: igdbId,
        });
      } catch (error) {
        logger.error(
          { error, igdbId },
          "Failed to fetch game details from IGDB"
        );
        return {
          success: false,
          error: "Failed to fetch game details from IGDB",
        };
      }

      igdbGameData = { game: igdbDetails.game };
    }

    if (!igdbGameData || !igdbGameData.game) {
      logger.error({ igdbId }, "No game data returned from IGDB");
      return {
        success: false,
        error: "Game not found in IGDB",
      };
    }

    const gameDetailService = new GameDetailService();
    const populatedGame = await gameDetailService.populateGameInDatabase(
      igdbGameData.game
    );

    if (!populatedGame) {
      logger.error({ igdbId }, "Game population returned no data");
      return {
        success: false,
        error: "Failed to create game record",
      };
    }

    gameId = populatedGame.id;
    gameSlug = populatedGame.slug;
    logger.info(
      { gameId, igdbId, slug: gameSlug },
      "Successfully created game in database"
    );
  }

  const libraryService = new LibraryService();
  const existingItems = await libraryService.findAllLibraryItemsByGameId({
    userId,
    gameId,
  });

  if (existingItems.length > 0) {
    logger.warn(
      { userId, gameId, existingCount: existingItems.length },
      "Game already in user library (marking as MATCHED)"
    );

    await tryUpdateStatus(
      importedGameService,
      importedGameId,
      userId,
      "MATCHED"
    );

    return {
      success: false,
      error: "Game already in library",
    };
  }

  const libraryItem = await libraryService.createLibraryItem({
    userId,
    gameId,
    libraryItem: {
      status: LIBRARY_STATUS_MAP[status],
      acquisitionType: AcquisitionType.DIGITAL,
      platform: "PC (Microsoft Windows)",
    },
  });

  await tryUpdateStatus(importedGameService, importedGameId, userId, "MATCHED");

  logger.info(
    {
      importedGameId,
      gameId,
      libraryItemId: libraryItem.id,
      gameSlug,
    },
    "Successfully imported game to library"
  );

  return {
    success: true,
    data: {
      libraryItem,
      gameSlug,
    },
  };
}
