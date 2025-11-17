"use server";

import type { LibraryItem } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { createServerAction } from "@/shared/lib";

import { addGameToLibrary } from "../../library/use-cases/add-game-to-library";
import { AddToLibrarySchema, type AddToLibraryInput } from "../schemas";

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
    const result = await addGameToLibrary({
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
        "Use case failed to add game"
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
