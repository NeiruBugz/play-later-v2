"use server";
import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services";
import type { LibraryItem } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import {
  UpdateLibraryStatusByIgdbSchema,
  type UpdateLibraryStatusByIgdbInput,
} from "../schemas";
import { addToLibraryAction } from "./add-to-library-action";
const logger = createLogger({
  [LOGGER_CONTEXT.SERVER_ACTION]: "updateLibraryStatusAction",
});
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateLibraryStatusAction(
  input: UpdateLibraryStatusByIgdbInput
): Promise<ActionResult<LibraryItem>> {
  try {
    logger.info(
      { igdbId: input.igdbId, status: input.status },
      "Updating library status"
    );
    const parsed = UpdateLibraryStatusByIgdbSchema.safeParse(input);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.errors }, "Invalid input data");
      return {
        success: false,
        error: "Invalid input data",
      };
    }
    const { igdbId, status } = parsed.data;
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthenticated user attempted to update library status");
      return {
        success: false,
        error: "You must be logged in to update your library",
      };
    }
    const libraryService = new LibraryService();
    const gameResult = await libraryService.findGameByIgdbId(igdbId);
    if (!gameResult.success || !gameResult.data) {
      logger.info(
        { igdbId, userId },
        "Game not in library, adding with new status"
      );
      return addToLibraryAction({ igdbId, status, platform: "PC" });
    }
    const game = gameResult.data;
    const libraryItemsResult =
      await libraryService.findMostRecentLibraryItemByGameId({
        userId,
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
      return addToLibraryAction({ igdbId, status, platform: "PC" });
    }
    const mostRecentItem = libraryItemsResult.data;
    const updateResult = await libraryService.updateLibraryItem({
      userId,
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
  } catch (error) {
    logger.error(
      { error, igdbId: input.igdbId },
      "Unexpected error in updateLibraryStatusAction"
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
