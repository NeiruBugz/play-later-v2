"use server";

import {
  GameDetailService,
  IgdbService,
  JournalService,
  LibraryService,
} from "@/data-access-layer/services";
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

import type { JournalEntryDomain } from "@/features/journal/types";
import type { LibraryItemDomain } from "@/features/library/types";
import { createLogger } from "@/shared/lib/app/logger";
import { LOGGER_CONTEXT } from "@/shared/lib/app/logger-context";
import type { FullGameInfoResponse } from "@/shared/types";

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

async function getCachedGameBySlug(slug: string) {
  "use cache";
  cacheLife({ revalidate: 300 });
  cacheTag("igdb-game-detail");

  const igdbService = new IgdbService();
  return igdbService.getGameDetailsBySlug({ slug });
}

async function getCachedTimesToBeat(igdbId: number) {
  "use cache";
  cacheLife({ revalidate: 3600 });
  cacheTag("igdb-times-to-beat");

  const igdbService = new IgdbService();
  try {
    const result = await igdbService.getTimesToBeat({ igdbId });
    return result.timesToBeat;
  } catch {
    return undefined;
  }
}

export const getGameDetails = cache(async function getGameDetails(params: {
  slug: string;
  userId?: string;
}): Promise<
  { success: true; data: GameDetailsResult } | { success: false; error: string }
> {
  try {
    logger.info({ slug: params.slug }, "Use case: Getting game details");

    let gameData;
    try {
      gameData = await getCachedGameBySlug(params.slug);
    } catch (error) {
      logger.error({ slug: params.slug, error }, "IGDB fetch failed");
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch game details",
      };
    }

    const game = gameData.game;

    const gameDetailService = new GameDetailService();
    gameDetailService.populateGameInDatabase(game).catch((error) => {
      logger.error(
        { error, slug: params.slug },
        "Background game population failed"
      );
    });

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

      const [timesToBeat, dbGame] = await Promise.all([
        getCachedTimesToBeat(game.id),
        libraryService.findGameByIgdbId(game.id),
      ]);

      if (dbGame) {
        gameId = dbGame.id;
        const journalService = new JournalService();
        const [mostRecentItem, allItems, fetchedJournalEntries] =
          await Promise.all([
            libraryService.findMostRecentLibraryItemByGameId({
              userId: params.userId,
              gameId: dbGame.id,
            }),
            libraryService.findAllLibraryItemsByGameId({
              userId: params.userId,
              gameId: dbGame.id,
            }),
            journalService
              .findJournalEntriesByGameId({
                userId: params.userId,
                gameId: dbGame.id,
                limit: 3,
              })
              .catch((error) => {
                logger.warn(
                  { error, userId: params.userId, gameId: dbGame.id },
                  "Failed to fetch journal entries; falling back to empty"
                );
                return [] as JournalEntryDomain[];
              }),
          ]);
        if (mostRecentItem) {
          userLibraryStatus = {
            mostRecent: mostRecentItem,
            updatedAt: mostRecentItem.updatedAt,
            allItems,
          };
          logger.debug(
            {
              userId: params.userId,
              gameId: dbGame.id,
              status: mostRecentItem.status,
              totalItems: allItems.length,
            },
            "Found user library status for game"
          );
        }
        journalEntries = fetchedJournalEntries;
        if (journalEntries.length > 0) {
          logger.debug(
            {
              userId: params.userId,
              gameId: dbGame.id,
              count: journalEntries.length,
            },
            "Found journal entries for game"
          );
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
    }

    const timesToBeat = await getCachedTimesToBeat(game.id);

    logger.info(
      {
        igdbId: game.id,
        slug: params.slug,
        franchiseIdsCount: franchiseIds.length,
        hasLibraryStatus: false,
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
