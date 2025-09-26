import "server-only";

import { z } from "zod";

import { deleteBacklogItem } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

/**
 * Shared business service for removing games from user collections.
 *
 * This service consolidates the common business logic of:
 * 1. Taking a backlog item ID
 * 2. Removing it from the user's backlog
 * 3. Handling authorization and validation
 *
 * Used by:
 * - Game collection management features
 * - Game detail pages for removing items
 */
export const removeGameFromCollection = authorizedActionClient
  .metadata({
    actionName: "removeGameFromCollection",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      backlogItemId: z.number(),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const { backlogItemId } = parsedInput;

    const result = await deleteBacklogItem({
      backlogItemId,
      userId,
    });

    if (!result) {
      throw new Error("Failed to remove game from collection");
    }

    return { success: true };
  });
