"use server";

import { LibraryService } from "@/data-access-layer/services";
import type { LibraryItem, LibraryItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";

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

/**
 * Server action: Update the status of a library item
 *
 * @param input - Library item ID and new status
 * @returns ActionResult with updated library item or error
 */
export const updateLibraryStatusAction = createServerAction<
  UpdateLibraryStatusInput,
  LibraryItem
>({
  actionName: "updateLibraryStatusAction",
  schema: UpdateLibraryStatusSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { libraryItemId, status } = input;

    logger.info(
      { libraryItemId, status, userId },
      "Updating library item status"
    );

    const libraryService = new LibraryService();
    const result = await libraryService.updateLibraryItem({
      userId: userId!,
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
  },
});
