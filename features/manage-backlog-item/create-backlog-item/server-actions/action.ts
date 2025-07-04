"use server";

import { BacklogItemService } from "@/domain/backlog-item/service";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";
import { BacklogItemStatus } from "@prisma/client";
import { zfd } from "zod-form-data";

export const createBacklogItem = authorizedActionClient
  .metadata({
    actionName: "createBacklogItem",
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
    const backlogCreateResult = await BacklogItemService.create(
      {
        backlogItem: {
          backlogStatus: parsedInput.status as BacklogItemStatus,
          platform: parsedInput.platform,
          startedAt: parsedInput.startedAt,
          completedAt: parsedInput.completedAt,
          acquisitionType: "DIGITAL",
        },
        userId,
        gameId: parsedInput.gameId,
      },
      userId
    );

    if (backlogCreateResult.isFailure) {
      return {
        message:
          backlogCreateResult.error.message || "Failed to create backlog item",
      };
    }

    RevalidationService.revalidateCollection();
  });
