"use server";

import { type LibraryItemStatus } from "@prisma/client";
import { zfd } from "zod-form-data";

import { createLibraryItem as createLibraryItemCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

export const createLibraryItem = authorizedActionClient
  .metadata({
    actionName: "createLibraryItem",
    requiresAuth: true,
  })
  .inputSchema(
    zfd.formData({
      gameId: zfd.text(),
      platform: zfd.text(),
      status: zfd.text(),
      startedAt: zfd.text().optional(),
      completedAt: zfd.text().optional(),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const libraryItem = await createLibraryItemCommand({
      libraryItem: {
        status: parsedInput.status as LibraryItemStatus,
        platform: parsedInput.platform,
        startedAt: parsedInput.startedAt
          ? new Date(parsedInput.startedAt)
          : undefined,
        completedAt: parsedInput.completedAt
          ? new Date(parsedInput.completedAt)
          : undefined,
        acquisitionType: "DIGITAL",
      },
      userId,
      gameId: parsedInput.gameId,
    });

    if (!libraryItem) {
      return {
        message: "Failed to create library item",
      };
    }

    RevalidationService.revalidateCollection();
  });
