"use server";

import { LibraryService } from "@/data-access-layer/services";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";

export const getPlayingGameAction = createServerAction<
  void,
  {
    id: string;
    title: string;
    igdbId: number;
    coverImage: string | null;
  } | null
>({
  actionName: "getPlayingGameAction",
  schema: z.void().optional(),
  requireAuth: true,
  handler: async ({ userId, logger }) => {
    logger.info({ userId }, "Fetching currently playing game");

    const libraryService = new LibraryService();
    const game = await libraryService.getMostRecentPlayingGame({
      userId: userId!,
    });

    if (!game) {
      logger.debug({ userId }, "No currently playing games found");
      return {
        success: true,
        data: null,
      };
    }

    logger.info(
      { userId, gameId: game.gameId },
      "Playing game fetched successfully"
    );

    return {
      success: true,
      data: {
        id: game.gameId,
        title: game.name,
        igdbId: game.igdbId,
        coverImage: game.coverImageId,
      },
    };
  },
});
