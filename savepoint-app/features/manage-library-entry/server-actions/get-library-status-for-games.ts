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
        const gameResult = await libraryService.findGameByIgdbId(igdbId);
        if (!gameResult.success || !gameResult.data) {
          statusMap[igdbId] = null;
          return;
        }

        const libraryResult =
          await libraryService.findMostRecentLibraryItemByGameId({
            userId: userId!,
            gameId: gameResult.data.id,
          });

        statusMap[igdbId] =
          libraryResult.success && libraryResult.data
            ? libraryResult.data.status
            : null;
      })
    );

    logger.info({ count: igdbIds.length }, "Library status fetched");

    return {
      success: true,
      data: statusMap,
    };
  },
});
