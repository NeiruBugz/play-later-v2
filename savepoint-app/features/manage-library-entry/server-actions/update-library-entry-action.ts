"use server";

import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";

import type { LibraryItemDomain } from "@/features/library/types";
import { createServerAction } from "@/shared/lib";

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
    const { libraryItemId, status, startedAt, completedAt, platform } = input;
    logger.info({ libraryItemId, status, userId }, "Updating library entry");
    const libraryService = new LibraryService();
    const normalizedPlatform =
      platform === undefined ? undefined : platform === "" ? null : platform;
    const updateResult = await libraryService.updateLibraryItem({
      userId: userId!,
      libraryItem: {
        id: libraryItemId,
        status,
        ...(status !== undefined && { statusChangedAt: new Date() }),
        ...(startedAt !== undefined && { startedAt }),
        ...(completedAt !== undefined && { completedAt }),
        ...(normalizedPlatform !== undefined && {
          platform: normalizedPlatform,
        }),
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
