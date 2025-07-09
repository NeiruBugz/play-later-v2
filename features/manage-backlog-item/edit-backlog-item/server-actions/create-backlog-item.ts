"use server";

import { AcquisitionType } from "@prisma/client";

import { createBacklogItem as createBacklogItemCommand } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

import { createBacklogItemSchema } from "./schema";

export const createBacklogItem = authorizedActionClient
  .metadata({
    actionName: "createBacklogItem",
    requiresAuth: true,
  })
  .inputSchema(createBacklogItemSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const result = await createBacklogItemCommand({
      gameId: parsedInput.gameId,
      userId,
      backlogItem: {
        platform: parsedInput.platform,
        status: parsedInput.status,
        startedAt: parsedInput.startedAt,
        completedAt: parsedInput.completedAt,
        acquisitionType: AcquisitionType.DIGITAL,
      },
    });

    if (!result) {
      return {
        message: "Failed to create backlog item",
      };
    }

    RevalidationService.revalidateGame(parsedInput.gameId);
  });
