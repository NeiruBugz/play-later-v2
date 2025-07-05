"use server";

import { BacklogItemService } from "@/domain/backlog-item/service";
import { z } from "zod";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

import { editBacklogItemSchema } from "./schema";

export const editBacklogItem = authorizedActionClient
  .metadata({
    actionName: "editBacklogItem",
    requiresAuth: true,
  })
  .inputSchema(editBacklogItemSchema)
  .outputSchema(
    z.object({
      message: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const result = await BacklogItemService.update(
      {
        id: parsedInput.id,
        status: parsedInput.status,
        platform: parsedInput.platform,
        startedAt: parsedInput.startedAt,
        completedAt: parsedInput.completedAt,
      },
      userId
    );

    if (result.isFailure) {
      return {
        message: result.error.message || "Failed to update backlog item",
      };
    }

    RevalidationService.revalidateCollection();

    return {
      message: "Success",
    };
  });
