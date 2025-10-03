"use server";

import { AcquisitionType } from "@prisma/client";

import { createLibraryItem as createLibraryItemCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

import { createLibraryItemSchema } from "./schema";

export const createLibraryItem = authorizedActionClient
  .metadata({
    actionName: "createLibraryItem",
    requiresAuth: true,
  })
  .inputSchema(createLibraryItemSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const result = await createLibraryItemCommand({
      gameId: parsedInput.gameId,
      userId,
      libraryItem: {
        platform: parsedInput.platform,
        status: parsedInput.status,
        startedAt: parsedInput.startedAt,
        completedAt: parsedInput.completedAt,
        acquisitionType: AcquisitionType.DIGITAL,
      },
    });

    if (!result) {
      return {
        message: "Failed to create library item",
      };
    }

    RevalidationService.revalidateGame(parsedInput.gameId);
  });
