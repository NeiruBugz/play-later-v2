"use server";

import { z } from "zod";

import { getBacklogItemsForUserByIgdbId } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getBacklogItemsByIgdbId = authorizedActionClient
  .metadata({
    actionName: "getBacklogItemsByIgdbId",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      igdbId: z.number(),
    })
  )
  .action(async ({ ctx: { userId }, parsedInput }) => {
    const backlogItems = await getBacklogItemsForUserByIgdbId({
      userId,
      igdbId: parsedInput.igdbId,
    });
    return backlogItems;
  });
