"use server";

import { BacklogItemService } from "@/domain/backlog-item/service";
import { AcquisitionType } from "@prisma/client";

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
    const result = await BacklogItemService.create(
      {
        gameId: parsedInput.gameId,
        userId,
        backlogItem: {
          platform: parsedInput.platform,
          backlogStatus: parsedInput.status,
          startedAt: parsedInput.startedAt,
          completedAt: parsedInput.completedAt,
          acquisitionType: AcquisitionType.DIGITAL,
        },
      },
      userId
    );

    if (result.isFailure) {
      return {
        message: result.error.message || "Failed to create backlog item",
      };
    }

    RevalidationService.revalidateGame(parsedInput.gameId);

    return {
      message: "Backlog item created successfully",
    };
  });
