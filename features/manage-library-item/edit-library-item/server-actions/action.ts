"use server";

import { z } from "zod";

import { updateLibraryItem } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

import { editLibraryItemSchema } from "./schema";

export const editLibraryItem = authorizedActionClient
  .metadata({
    actionName: "editLibraryItem",
    requiresAuth: true,
  })
  .inputSchema(editLibraryItemSchema)
  .outputSchema(
    z
      .object({
        message: z.string().optional(),
      })
      .optional()
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const result = await updateLibraryItem({
      userId,
      libraryItem: {
        id: parsedInput.id,
        status: parsedInput.status,
        platform: parsedInput.platform,
        startedAt: parsedInput.startedAt,
        completedAt: parsedInput.completedAt,
      },
    });

    if (!result) {
      return {
        message: "Failed to update library item",
      };
    }

    RevalidationService.revalidateCollection();
  });
