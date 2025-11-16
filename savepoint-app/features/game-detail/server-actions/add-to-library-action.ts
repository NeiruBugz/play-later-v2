"use server";

import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services";
import type { LibraryItem } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { AddToLibrarySchema, type AddToLibraryInput } from "../schemas";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVER_ACTION]: "addToLibraryAction",
});

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Server action: Add a game to the user's library
 */
export async function addToLibraryAction(
  input: AddToLibraryInput
): Promise<ActionResult<LibraryItem>> {
  try {
    logger.info({ igdbId: input.igdbId }, "Adding game to library");

    const parsed = AddToLibrarySchema.safeParse(input);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.errors }, "Invalid input data");
      return {
        success: false,
        error: "Invalid input data",
      };
    }

    const { igdbId, status, platform, startedAt, completedAt } = parsed.data;

    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthenticated user attempted to add game to library");
      return {
        success: false,
        error: "You must be logged in to add games to your library",
      };
    }

    const libraryService = new LibraryService();
    const result = await libraryService.addGameToLibrary({
      userId,
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
  } catch (error) {
    logger.error(
      { error, igdbId: input.igdbId },
      "Unexpected error in addToLibraryAction"
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
