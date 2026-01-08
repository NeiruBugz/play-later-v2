"use server";

import {
  GameDetailService,
  IgdbService,
  JournalService,
  LibraryService,
} from "@/data-access-layer/services";
import { cache } from "react";

import { createLogger } from "@/shared/lib/app/logger";
import { LOGGER_CONTEXT } from "@/shared/lib/app/logger-context";
import type {
  FullGameInfoResponse,
  JournalEntryDomain,
  LibraryItemDomain,
} from "@/shared/types";

const logger = createLogger({
  [LOGGER_CONTEXT.USE_CASE]: "getGameDetailsUseCase",
});
type GameDetailsResult = {
  game: FullGameInfoResponse;
  gameId?: string; // Database game ID (UUID)
  franchiseIds: number[];
  timesToBeat?: {
    mainStory?: number;
    completionist?: number;
  };
  userLibraryStatus?: {
    mostRecent: LibraryItemDomain;
    updatedAt: Date;
    allItems: LibraryItemDomain[];
  };
  journalEntries: JournalEntryDomain[];
};

export const getGameDetails = cache(async function getGameDetails(params: {
  slug: string;
  userId?: string;
}): Promise<
  { success: true; data: GameDetailsResult } | { success: false; error: string }
> {
  try {
    logger.info({ slug: params.slug }, "Use case: Getting game details");
    const igdbService = new IgdbService();
    const igdbResult = await igdbService.getGameDetailsBySlug({
      slug: params.slug,
    });
    if (!igdbResult.success) {
      logger.error(
        { slug: params.slug, error: igdbResult.error },
        "IGDB fetch failed"
      );
      return {
        success: false,
        error: igdbResult.error,
      };
    }
    const game = igdbResult.data.game;
    const gameDetailService = new GameDetailService();
    gameDetailService
      .populateGameInDatabase(game)
      .catch((err) =>
        logger.error(
          { err, slug: params.slug },
          "Background game population failed"
        )
      );
    const franchiseIds: number[] = [];
    if (typeof game.franchise === "number" && game.franchise > 0) {
      franchiseIds.push(game.franchise);
    } else if (typeof game.franchise === "object" && game.franchise?.id) {
      franchiseIds.push(game.franchise.id);
    }
    if (game.franchises && game.franchises.length > 0) {
      game.franchises.forEach((id) => {
        if (!franchiseIds.includes(id)) {
          franchiseIds.push(id);
        }
      });
    }
    logger.info(
      {
        franchiseIds,
        gameFranchise: game.franchise,
        gameFranchises: game.franchises,
        gameId: game.id,
        gameName: game.name,
      },
      "Determined franchise IDs for related games"
    );
    const timesToBeatResult = await igdbService.getTimesToBeat({
      igdbId: game.id,
    });
    const timesToBeat = timesToBeatResult.success
      ? timesToBeatResult.data.timesToBeat
      : undefined;
    let userLibraryStatus:
      | {
          mostRecent: LibraryItemDomain;
          updatedAt: Date;
          allItems: LibraryItemDomain[];
        }
      | undefined;
    let journalEntries: JournalEntryDomain[] = [];
    let gameId: string | undefined;
    if (params.userId) {
      const libraryService = new LibraryService();
      const gameResult = await libraryService.findGameByIgdbId(game.id);
      if (gameResult.success && gameResult.data) {
        gameId = gameResult.data.id;
        const journalService = new JournalService();
        const [libraryItemResult, allLibraryItemsResult, journalEntriesResult] =
          await Promise.all([
            libraryService.findMostRecentLibraryItemByGameId({
              userId: params.userId,
              gameId: gameResult.data.id,
            }),
            libraryService.findAllLibraryItemsByGameId({
              userId: params.userId,
              gameId: gameResult.data.id,
            }),
            journalService.findJournalEntriesByGameId({
              userId: params.userId,
              gameId: gameResult.data.id,
              limit: 3,
            }),
          ]);
        if (
          libraryItemResult.success &&
          libraryItemResult.data &&
          libraryItemResult.data !== null
        ) {
          const allItems =
            allLibraryItemsResult.success && allLibraryItemsResult.data
              ? allLibraryItemsResult.data
              : [];
          userLibraryStatus = {
            mostRecent: libraryItemResult.data,
            updatedAt: libraryItemResult.data.updatedAt,
            allItems,
          };
          logger.debug(
            {
              userId: params.userId,
              gameId: gameResult.data.id,
              status: libraryItemResult.data.status,
              totalItems: allItems.length,
            },
            "Found user library status for game"
          );
        }
        if (journalEntriesResult.success && journalEntriesResult.data) {
          journalEntries = journalEntriesResult.data;
          logger.debug(
            {
              userId: params.userId,
              gameId: gameResult.data.id,
              count: journalEntries.length,
            },
            "Found journal entries for game"
          );
        }
      }
    }
    logger.info(
      {
        igdbId: game.id,
        slug: params.slug,
        franchiseIdsCount: franchiseIds.length,
        hasLibraryStatus: !!userLibraryStatus,
      },
      "Game details fetched successfully"
    );
    return {
      success: true,
      data: {
        game,
        gameId,
        franchiseIds,
        timesToBeat,
        userLibraryStatus,
        journalEntries,
      },
    };
  } catch (error) {
    logger.error(
      { error, slug: params.slug },
      "Use case failed: Get game details"
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
