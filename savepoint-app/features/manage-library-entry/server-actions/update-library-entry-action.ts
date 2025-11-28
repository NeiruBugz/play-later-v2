"use server";

import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import { createServerAction } from "@/shared/lib";
import type { LibraryItemDomain } from "@/shared/types";

import {
  UpdateLibraryEntrySchema,
  type UpdateLibraryEntryInput,
} from "../schemas";

export const updateLibraryEntryAction = createServerAction<
  UpdateLibraryEntryInput,
  LibraryItemDomain
>({
  actionName: "updateLibraryEntryAction",
  schema: UpdateLibraryEntrySchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { libraryItemId, status, startedAt, completedAt } = input;
    logger.info({ libraryItemId, status, userId }, "Updating library entry");
    const libraryService = new LibraryService();
    const updateResult = await libraryService.updateLibraryItem({
      userId: userId!,
      libraryItem: {
        id: libraryItemId,
        status,
        ...(startedAt !== undefined && { startedAt }),
        ...(completedAt !== undefined && { completedAt }),
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
  },
});
