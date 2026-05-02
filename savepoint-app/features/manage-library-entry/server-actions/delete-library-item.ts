"use server";

import { LibraryService } from "@/data-access-layer/services";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { createServerAction, userTags, type ActionResult } from "@/shared/lib";

const DeleteLibraryItemSchema = z.object({
  libraryItemId: z.number().int().positive(),
});
export type DeleteLibraryItemInput = z.infer<typeof DeleteLibraryItemSchema>;

export const deleteLibraryItemAction = createServerAction<
  DeleteLibraryItemInput,
  void
>({
  actionName: "deleteLibraryItemAction",
  schema: DeleteLibraryItemSchema,
  requireAuth: true,
  handler: async ({ input, userId, logger }): Promise<ActionResult<void>> => {
    const { libraryItemId } = input;

    logger.info({ libraryItemId }, "Attempting to delete library item");

    const libraryService = new LibraryService();
    await libraryService.deleteLibraryItem({
      libraryItemId,
      userId: userId!,
    });

    const tags = userTags(userId!);
    revalidateTag(tags.libraryCounts, "max");
    revalidateTag(tags.profileStats, "max");
    revalidatePath("/library");
    revalidatePath("/games/[slug]", "page");

    logger.info({ userId, libraryItemId }, "Library item deleted successfully");

    return {
      success: true,
      data: undefined,
    };
  },
});
