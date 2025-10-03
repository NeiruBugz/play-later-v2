import { z } from "zod";

import { getManyLibraryItems } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getLibraryItems = authorizedActionClient
  .metadata({
    actionName: "getLibraryItems",
    requiresAuth: true,
  })
  .inputSchema(z.object({ gameId: z.string() }))
  .action(async ({ ctx: { userId }, parsedInput: { gameId } }) => {
    try {
      return await getManyLibraryItems({
        userId,
        gameId,
      });
    } catch (e) {
      console.error("Error fetching library items for game:", e);
      return [];
    }
  });
