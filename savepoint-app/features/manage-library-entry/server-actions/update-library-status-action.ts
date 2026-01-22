"use server";

import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import { createServerAction } from "@/shared/lib";
import type { LibraryItemDomain } from "@/shared/types";

import {
  UpdateLibraryStatusByIgdbSchema,
  type UpdateLibraryStatusByIgdbInput,
} from "../schemas";
import { addToLibraryAction } from "./add-to-library-action";

export const updateLibraryStatusAction = createServerAction<
  UpdateLibraryStatusByIgdbInput,
  LibraryItemDomain
>({
  actionName: "updateLibraryStatusAction",
  schema: UpdateLibraryStatusByIgdbSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { igdbId, status } = input;

    logger.info({ igdbId, status, userId }, "Updating library status");

    const libraryService = new LibraryService();
    const gameResult = await libraryService.findGameByIgdbId(igdbId);

    if (!gameResult.success || !gameResult.data) {
      logger.info(
        { igdbId, userId },
        "Game not in library, adding with new status"
      );
      return addToLibraryAction({ igdbId, status, platform: undefined });
    }

    const game = gameResult.data;
    const libraryItemsResult =
      await libraryService.findMostRecentLibraryItemByGameId({
        userId: userId!,
        gameId: game.id,
      });

    if (!libraryItemsResult.success) {
      logger.error(
        { error: libraryItemsResult.error, userId, gameId: game.id },
        "Failed to find library items"
      );
      return {
        success: false,
        error: "Failed to find library items",
      };
    }

    if (!libraryItemsResult.data) {
      logger.info(
        { igdbId, userId },
        "No library item found, adding game to library"
      );
      return addToLibraryAction({ igdbId, status, platform: undefined });
    }

    const mostRecentItem = libraryItemsResult.data;
    const updateResult = await libraryService.updateLibraryItem({
      userId: userId!,
      libraryItem: {
        id: mostRecentItem.id,
        status,
      },
    });

    if (!updateResult.success) {
      logger.error(
        { error: updateResult.error, userId, libraryItemId: mostRecentItem.id },
        "Failed to update library item"
      );
      return {
        success: false,
        error: "Failed to update library status",
      };
    }

    revalidatePath(`/games/${game.slug}`);
    logger.info(
      {
        userId,
        libraryItemId: updateResult.data.id,
        status,
      },
      "Library status updated successfully"
    );

    return {
      success: true,
      data: updateResult.data,
    };
  },
});
