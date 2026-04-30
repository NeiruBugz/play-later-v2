"use server";

import { LibraryService } from "@/data-access-layer/services";

import { createServerAction } from "@/shared/lib";
import type { LibraryItemStatus } from "@/shared/types";

import {
  GetLibraryStatusForGamesSchema,
  type GetLibraryStatusForGamesInput,
} from "../schemas";

export const getLibraryStatusForGames = createServerAction<
  GetLibraryStatusForGamesInput,
  Record<number, LibraryItemStatus | null>
>({
  actionName: "getLibraryStatusForGames",
  schema: GetLibraryStatusForGamesSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { igdbIds } = input;

    logger.info(
      { igdbIds: igdbIds.length, userId },
      "Fetching library status for games"
    );

    const libraryService = new LibraryService();
    const statusMap: Record<number, LibraryItemStatus | null> = {};

    await Promise.all(
      igdbIds.map(async (igdbId: number) => {
        const game = await libraryService.findGameByIgdbId(igdbId);
        if (!game) {
          statusMap[igdbId] = null;
          return;
        }

        const item = await libraryService.findMostRecentLibraryItemByGameId({
          userId: userId!,
          gameId: game.id,
        });

        statusMap[igdbId] = item ? item.status : null;
      })
    );

    logger.info({ count: igdbIds.length }, "Library status fetched");

    return {
      success: true,
      data: statusMap,
    };
  },
});
