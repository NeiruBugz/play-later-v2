"use server";

import { getServerUserId } from "@/auth";
import { LibraryService } from "@/data-access-layer/services";
import type { LibraryItem, LibraryItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVER_ACTION]: "updateLibraryStatusAction",
});

/**
 * Zod schema for update library status input validation
 */
const UpdateLibraryStatusSchema = z.object({
  libraryItemId: z.number().int().positive(),
  status: z.enum([
    "CURIOUS_ABOUT",
    "CURRENTLY_EXPLORING",
    "TOOK_A_BREAK",
    "EXPERIENCED",
    "WISHLIST",
    "REVISITING",
  ]),
});

export type UpdateLibraryStatusInput = z.infer<
  typeof UpdateLibraryStatusSchema
>;

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Server action: Update the status of a library item
 *
 * @param input - Library item ID and new status
 * @returns ActionResult with updated library item or error
 */
export async function updateLibraryStatusAction(
  input: UpdateLibraryStatusInput
): Promise<ActionResult<LibraryItem>> {
  try {
    logger.info(
      { libraryItemId: input.libraryItemId, status: input.status },
      "Updating library item status"
    );

    const parsed = UpdateLibraryStatusSchema.safeParse(input);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.errors }, "Invalid input data");
      return {
        success: false,
        error: "Invalid input data",
      };
    }

    const { libraryItemId, status } = parsed.data;

    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthenticated user attempted to update library status");
      return {
        success: false,
        error: "You must be logged in to update your library",
      };
    }

    const libraryService = new LibraryService();
    const result = await libraryService.updateLibraryItem({
      userId,
      libraryItem: {
        id: libraryItemId,
        status: status as LibraryItemStatus,
      },
    });

    if (!result.success) {
      logger.error(
        { error: result.error, userId, libraryItemId },
        "LibraryService failed to update library item"
      );
      return {
        success: false,
        error: result.error,
      };
    }

    revalidatePath("/library");

    logger.info(
      {
        userId,
        libraryItemId: result.data.id,
        status,
      },
      "Library item status updated successfully"
    );

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    logger.error(
      { error, libraryItemId: input.libraryItemId },
      "Unexpected error in updateLibraryStatusAction"
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
