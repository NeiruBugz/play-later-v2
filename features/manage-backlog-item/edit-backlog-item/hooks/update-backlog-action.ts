"use server";

import { BacklogItemStatus } from "@prisma/client";
import { z } from "zod";

import { updateBacklogItem } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

export const updateBacklogItemAction = authorizedActionClient
  .metadata({
    actionName: "updateBacklogItem",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      id: z.number(),
      status: z.nativeEnum(BacklogItemStatus),
    })
  )
  .action(async ({ parsedInput: { id, status }, ctx: { userId } }) => {
    const result = await updateBacklogItem({
      userId,
      backlogItem: {
        id,
        status,
      },
    });

    if (!result) {
      return {
        message: "Failed to update backlog item status",
        success: false,
      };
    }

    RevalidationService.revalidateCollection();
  });
