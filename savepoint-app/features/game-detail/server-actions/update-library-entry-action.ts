"use server";

import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services";
import type { LibraryItem } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { createLogger } from "@/shared/lib/app/logger";
import { LOGGER_CONTEXT } from "@/shared/lib/app/logger-context";

import {
  UpdateLibraryEntrySchema,
  type UpdateLibraryEntryInput,
} from "../schemas";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVER_ACTION]: "updateLibraryEntryAction",
});

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Server action: Update a specific library entry by library item ID
 *
 * Flow:
 * 1. Validate input with Zod
 * 2. Get authenticated user ID
 * 3. Call LibraryService to update the library item
 * 4. Revalidate the game detail page
 */
export async function updateLibraryEntryAction(
  input: UpdateLibraryEntryInput
): Promise<ActionResult<LibraryItem>> {
  try {
    logger.info(
      { libraryItemId: input.libraryItemId, status: input.status },
      "Updating library entry"
    );

    // 1. Validate input
    const parsed = UpdateLibraryEntrySchema.safeParse(input);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.errors }, "Invalid input data");
      return {
        success: false,
        error: "Invalid input data",
      };
    }

    const { libraryItemId, status, platform } = parsed.data;

    // 2. Get authenticated user ID
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthenticated user attempted to update library entry");
      return {
        success: false,
        error: "You must be logged in to update your library",
      };
    }

    // 3. Call LibraryService to update the library item
    const libraryService = new LibraryService();
    const updateResult = await libraryService.updateLibraryItem({
      userId,
      libraryItem: {
        id: libraryItemId,
        status,
        ...(platform !== undefined && { platform }),
      },
    });

    if (!updateResult.success) {
      logger.error(
        { error: updateResult.error, userId, libraryItemId },
        "Failed to update library entry"
      );
      return {
        success: false,
        error: "Failed to update library entry",
      };
    }

    // 4. Revalidate the game detail page
    // We need to get the game to find its slug for revalidation
    // The library service should return the game info, but for now we'll revalidate all paths
    // This is a limitation we can improve later
    revalidatePath("/games/[slug]", "page");

    logger.info(
      {
        userId,
        libraryItemId: updateResult.data.id,
        status,
      },
      "Library entry updated successfully"
    );

    return {
      success: true,
      data: updateResult.data,
    };
  } catch (error) {
    logger.error(
      { error, libraryItemId: input.libraryItemId },
      "Unexpected error in updateLibraryEntryAction"
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
