"use server";

import { LibraryService } from "@/data-access-layer/services";
import type { LibraryItem } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { createServerAction, type ActionResult } from "@/shared/lib";

import { AddToLibrarySchema, type AddToLibraryInput } from "../schemas";

/**
 * Server action: Add a game to the user's library
 */
export const addToLibraryAction = createServerAction<
  AddToLibraryInput,
  LibraryItem
>({
  actionName: "addToLibraryAction",
  schema: AddToLibrarySchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { igdbId, status, platform, startedAt, completedAt } = input;

    logger.info({ igdbId, userId }, "Adding game to library");

    const libraryService = new LibraryService();
    const result = await libraryService.addGameToLibrary({
      userId: userId!,
      igdbId,
      status,
      platform,
      startedAt,
      completedAt,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId, igdbId },
        "LibraryService failed to add game"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath(`/games/${result.data.gameSlug}`);

    logger.info(
      {
        userId,
        libraryItemId: result.data.libraryItem.id,
        status,
      },
      "Game added to library successfully"
    );

    return {
      success: true,
      data: result.data.libraryItem,
    };
  },
});
