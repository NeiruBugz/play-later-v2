"use server";

import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";
import { LibraryItemStatus, type LibraryItemDomain } from "@/shared/types";

const UpdateLibraryStatusSchema = z.object({
  libraryItemId: z.number().int().positive(),
  status: z.nativeEnum(LibraryItemStatus),
});
export type UpdateLibraryStatusInput = z.infer<
  typeof UpdateLibraryStatusSchema
>;

export const updateLibraryStatusAction = createServerAction<
  UpdateLibraryStatusInput,
  LibraryItemDomain
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
        status,
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
