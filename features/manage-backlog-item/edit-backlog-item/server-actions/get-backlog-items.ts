import { z } from "zod";

import { getManyBacklogItems } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getBacklogItems = authorizedActionClient
  .metadata({
    actionName: "getBacklogItems",
    requiresAuth: true,
  })
  .inputSchema(z.object({ gameId: z.string() }))
  .action(async ({ ctx: { userId }, parsedInput: { gameId } }) => {
    try {
      return await getManyBacklogItems({
        userId,
        gameId,
      });
    } catch (e) {
      console.error("Error fetching backlog items for game:", e);
      return [];
    }
  });
