"use server";

import { z } from "zod";

import { updateBacklogItem } from "@/shared/lib/repository";
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
    z
      .object({
        message: z.string().optional(),
      })
      .optional()
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const result = await updateBacklogItem({
      userId,
      backlogItem: {
        id: parsedInput.id,
        status: parsedInput.status,
        platform: parsedInput.platform,
        startedAt: parsedInput.startedAt,
        completedAt: parsedInput.completedAt,
      },
    });

    if (!result) {
      return {
        message: "Failed to update backlog item",
      };
    }

    RevalidationService.revalidateCollection();
  });
