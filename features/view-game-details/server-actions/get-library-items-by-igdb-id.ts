"use server";

import { z } from "zod";

import { getLibraryItemsForUserByIgdbId } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getLibraryItemsByIgdbId = authorizedActionClient
  .metadata({
    actionName: "getLibraryItemsByIgdbId",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      igdbId: z.number(),
    })
  )
  .action(async ({ ctx: { userId }, parsedInput }) => {
    const libraryItems = await getLibraryItemsForUserByIgdbId({
      userId,
      igdbId: parsedInput.igdbId,
    });
    return libraryItems;
  });
