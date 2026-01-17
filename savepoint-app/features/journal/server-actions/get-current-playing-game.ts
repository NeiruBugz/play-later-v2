"use server";

import { LibraryService } from "@/data-access-layer/services";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";

type CurrentPlayingGame = {
  gameId: string;
  igdbId: number;
  name: string;
  coverImageId: string | null;
} | null;

export const getCurrentPlayingGameAction = createServerAction<
  void,
  CurrentPlayingGame
>({
  actionName: "getCurrentPlayingGameAction",
  schema: z.void().optional(),
  requireAuth: true,
  handler: async ({ userId, logger }) => {
    logger.info({ userId }, "Fetching current playing game");

    const libraryService = new LibraryService();
    const result = await libraryService.getMostRecentPlayingGame({
      userId: userId!,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId },
        "Failed to fetch current playing game"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info(
      {
        userId,
        gameId: result.data?.gameId ?? null,
      },
      "Current playing game fetched successfully"
    );

    return {
      success: true,
      data: result.data,
    };
  },
});
