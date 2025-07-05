import { z } from "zod";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getBacklogItems = authorizedActionClient
  .metadata({
    actionName: "getBacklogItems",
    requiresAuth: true,
  })
  .inputSchema(z.object({ gameId: z.string() }))
  .action(async ({ ctx: { userId }, parsedInput: { gameId } }) => {
    try {
      return await prisma.backlogItem.findMany({
        where: { gameId, userId },
        orderBy: { createdAt: "asc" },
      });
    } catch (e) {
      console.error("Error fetching backlog items for game:", e);
      return [];
    }
  });
