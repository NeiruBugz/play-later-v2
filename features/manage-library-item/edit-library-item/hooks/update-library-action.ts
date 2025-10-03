"use server";

import { LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

import { updateLibraryItem } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

export const updateLibraryItemAction = authorizedActionClient
  .metadata({
    actionName: "updateLibraryItem",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      id: z.number(),
      status: z.nativeEnum(LibraryItemStatus),
    })
  )
  .action(async ({ parsedInput: { id, status }, ctx: { userId } }) => {
    const result = await updateLibraryItem({
      userId,
      libraryItem: {
        id,
        status,
      },
    });

    if (!result) {
      return {
        message: "Failed to update library item status",
        success: false,
      };
    }

    RevalidationService.revalidateCollection();
  });
