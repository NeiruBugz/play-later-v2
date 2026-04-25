"use server";

import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import type { LibraryItemDomain } from "@/features/library/types";
import { createServerAction } from "@/shared/lib";

import {
  UpdateLibraryStatusSchema,
  type UpdateLibraryStatusInput,
} from "../schemas";

export const updateLibraryStatusAction = createServerAction<
  UpdateLibraryStatusInput,
  LibraryItemDomain
>({
  actionName: "updateLibraryStatusAction",
  schema: UpdateLibraryStatusSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }) => {
    const { libraryItemId, status, startedAt } = input;
    logger.info(
      { libraryItemId, status, userId },
      "Updating library item status"
    );
    const libraryService = new LibraryService();
    const result = await libraryService.updateLibraryItem({
      userId: userId!,
      libraryItem: {
        id: libraryItemId,
        status,
        startedAt,
        statusChangedAt: new Date(),
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
