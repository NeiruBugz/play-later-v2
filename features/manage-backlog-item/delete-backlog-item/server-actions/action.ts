"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";

import { deleteBacklogItem } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { RevalidationService } from "@/shared/ui/revalidation";

export const deleteBacklogItemAction = authorizedActionClient
  .metadata({
    actionName: "deleteBacklogItem",
    requiresAuth: true,
  })
  .inputSchema(
    zfd.formData({
      id: zfd.numeric(),
    })
  )
  .outputSchema(
    z
      .object({
        message: z.string(),
      })
      .optional()
  )
  .action(async ({ parsedInput: { id }, ctx: { userId } }) => {
    const result = await deleteBacklogItem({
      backlogItemId: id,
      userId,
    });

    if (!result) {
      return {
        message: "Failed to delete backlog item",
      };
    }

    RevalidationService.revalidateCollection();
  });
