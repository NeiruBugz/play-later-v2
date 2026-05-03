"use server";

import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath, updateTag } from "next/cache";

import type { LibraryItemDomain } from "@/features/library/types";
import { createServerAction, userTags } from "@/shared/lib";

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
    const data = await libraryService.updateLibraryItem({
      userId: userId!,
      libraryItem: {
        id: libraryItemId,
        status,
        startedAt,
        statusChangedAt: new Date(),
      },
    });
    const tags = userTags(userId!);
    updateTag(tags.libraryCounts);
    updateTag(tags.profileStats);
    revalidatePath("/library");
    logger.info(
      {
        userId,
        libraryItemId: data.id,
        status,
      },
      "Library item status updated successfully"
    );
    return {
      success: true,
      data,
    };
  },
});
