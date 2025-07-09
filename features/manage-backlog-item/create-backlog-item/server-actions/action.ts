"use server";

import { BacklogItemStatus } from "@prisma/client";
import { zfd } from "zod-form-data";

import { createBacklogItem as createBacklogItemCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

export const createBacklogItem = authorizedActionClient
  .metadata({
    actionName: "createBacklogItem",
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
    const backlogItem = await createBacklogItemCommand({
      backlogItem: {
        status: parsedInput.status as BacklogItemStatus,
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

    if (!backlogItem) {
      return {
        message: "Failed to create backlog item",
      };
    }

    RevalidationService.revalidateCollection();
  });
