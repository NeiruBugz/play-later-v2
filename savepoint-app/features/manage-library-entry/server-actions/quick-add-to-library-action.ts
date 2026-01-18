"use server";

import { revalidatePath } from "next/cache";

import { createServerAction } from "@/shared/lib";
import type { LibraryItemDomain } from "@/shared/types";

import {
  QuickAddToLibrarySchema,
  type QuickAddToLibraryInput,
} from "../schemas";
import { addGameToLibrary } from "../use-cases/add-game-to-library";

export const quickAddToLibraryAction = createServerAction<
  QuickAddToLibraryInput,
  LibraryItemDomain
>({
  actionName: "quickAddToLibraryAction",
  schema: QuickAddToLibrarySchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { igdbId, status } = input;

    logger.info({ igdbId, status, userId }, "Quick-adding game to library");

    const result = await addGameToLibrary({
      userId: userId!,
      igdbId,
      status,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId, igdbId },
        "Use case failed to quick-add game"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath(`/games/${result.data.gameSlug}`);
    revalidatePath("/library");

    logger.info(
      {
        userId,
        libraryItemId: result.data.libraryItem.id,
        status,
      },
      "Game quick-added to library successfully"
    );

    return {
      success: true,
      data: result.data.libraryItem,
    };
  },
});
