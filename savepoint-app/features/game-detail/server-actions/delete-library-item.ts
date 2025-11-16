"use server";

import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVER_ACTION]: "deleteLibraryItemAction",
});

/**
 * Zod schema for delete library item input validation
 */
const DeleteLibraryItemSchema = z.object({
  libraryItemId: z.number().int().positive(),
});

export type DeleteLibraryItemInput = z.infer<typeof DeleteLibraryItemSchema>;

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Server action: Delete a library item from the user's library
 *
 * Flow:
 * 1. Validate input with Zod
 * 2. Get authenticated user ID
 * 3. Call LibraryService to delete the library item
 * 4. Revalidate relevant paths
 *
 * @param input - Library item ID to delete
 * @returns ActionResult indicating success or error
 */
export async function deleteLibraryItemAction(
  input: DeleteLibraryItemInput
): Promise<ActionResult> {
  try {
    logger.info(
      { libraryItemId: input.libraryItemId },
      "Attempting to delete library item"
    );

    // 1. Validate input
    const parsed = DeleteLibraryItemSchema.safeParse(input);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.errors }, "Invalid input data");
      return {
        success: false,
        error: "Invalid input data",
      };
    }

    const { libraryItemId } = parsed.data;

    // 2. Get authenticated user ID
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthenticated user attempted to delete library item");
      return {
        success: false,
        error: "You must be logged in to delete library items",
      };
    }

    // 3. Call LibraryService to delete the library item
    const libraryService = new LibraryService();
    const result = await libraryService.deleteLibraryItem({
      libraryItemId,
      userId,
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId, libraryItemId },
        "LibraryService failed to delete library item"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    // 4. Revalidate paths
    // Revalidate the library page to remove the deleted item
    revalidatePath("/library");
    // Also revalidate game detail pages (using pattern to cover all game pages)
    revalidatePath("/games/[slug]", "page");

    logger.info(
      {
        userId,
        libraryItemId,
      },
      "Library item deleted successfully"
    );

    return {
      success: true,
    };
  } catch (error) {
    logger.error(
      { error, libraryItemId: input.libraryItemId },
      "Unexpected error in deleteLibraryItemAction"
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
