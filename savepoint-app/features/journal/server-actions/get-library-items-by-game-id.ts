"use server";

import type { LibraryItemDomain } from "@/data-access-layer/domain/library";
import { LibraryService } from "@/data-access-layer/services";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";

const GetLibraryItemsByGameIdSchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
});

export const getLibraryItemsByGameIdAction = createServerAction<
  z.infer<typeof GetLibraryItemsByGameIdSchema>,
  LibraryItemDomain[]
>({
  actionName: "getLibraryItemsByGameIdAction",
  schema: GetLibraryItemsByGameIdSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { gameId } = input;
    logger.info({ gameId, userId }, "Fetching library items by game ID");

    const libraryService = new LibraryService();
    const result = await libraryService.findAllLibraryItemsByGameId({
      userId: userId!,
      gameId,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId, gameId },
        "Failed to fetch library items"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info(
      { userId, gameId, count: result.data.length },
      "Library items fetched successfully"
    );
    return {
      success: true,
      data: result.data,
    };
  },
});
