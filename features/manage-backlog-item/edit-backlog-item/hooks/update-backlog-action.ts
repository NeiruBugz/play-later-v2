"use server";

import { BacklogItemService } from "@/domain/backlog-item/service";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";
import { BacklogItemStatus } from "@prisma/client";
import { z } from "zod";

export const updateBacklogItemAction = authorizedActionClient
  .metadata({
    actionName: "updateBacklogItem",
  })
  .inputSchema(
    z.object({
      id: z.number(),
      status: z.nativeEnum(BacklogItemStatus),
    })
  )
  .action(async ({ parsedInput: { id, status }, ctx: { userId } }) => {
    const result = await BacklogItemService.updateStatus(
      {
        id,
        status: status as unknown as BacklogItemStatus,
      },
      userId
    );

    if (result.isFailure) {
      return {
        message: result.error.message || "Failed to update backlog item status",
        success: false,
      };
    }

    RevalidationService.revalidateCollection();

    return {
      message: "Status updated successfully",
      success: true,
    };
  });
