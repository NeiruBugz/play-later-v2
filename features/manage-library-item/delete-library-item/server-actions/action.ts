"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";

import { deleteLibraryItem } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

export const deleteLibraryItemAction = authorizedActionClient
  .metadata({
    actionName: "deleteLibraryItem",
    requiresAuth: true,
  })
  .inputSchema(
    zfd.formData({
      id: zfd.numeric(),
    })
  )
  .outputSchema(
    z
      .object({
        message: z.string(),
      })
      .optional()
  )
  .action(async ({ parsedInput: { id }, ctx: { userId } }) => {
    const result = await deleteLibraryItem({
      libraryItemId: id,
      userId,
    });

    if (!result) {
      return {
        message: "Failed to delete library item",
      };
    }

    RevalidationService.revalidateCollection();
  });
