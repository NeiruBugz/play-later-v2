import { wrapWithResult } from "@/domain/shared/result";
import { z } from "zod";

import { prisma } from "@/shared/lib/db";
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
    const backlogItems = await prisma.backlogItem.findMany({
      where: { userId, game: { igdbId: parsedInput.igdbId } },
    });

    return wrapWithResult(async () => {
      return backlogItems;
    }, "Failed to get backlog items for user by IGDB ID");
  });
