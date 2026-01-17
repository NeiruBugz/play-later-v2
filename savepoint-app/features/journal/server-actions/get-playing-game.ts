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
    const result = await libraryService.getMostRecentPlayingGame({
      userId: userId!,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId },
        "Failed to fetch playing game"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    if (!result.data) {
      logger.debug({ userId }, "No currently playing games found");
      return {
        success: true,
        data: null,
      };
    }

    logger.info(
      { userId, gameId: result.data.gameId },
      "Playing game fetched successfully"
    );

    return {
      success: true,
      data: {
        id: result.data.gameId,
        title: result.data.name,
        igdbId: result.data.igdbId,
        coverImage: result.data.coverImageId,
      },
    };
  },
});
