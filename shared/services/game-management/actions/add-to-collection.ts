import "server-only";

import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { z } from "zod";

import { addGameToUserBacklog } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

/**
 * Shared business service for adding games to user collections.
 *
 * This service consolidates the common business logic of:
 * 1. Taking an IGDB game ID and backlog metadata
 * 2. Finding or creating the game in the database
 * 3. Adding it to the user's backlog
 *
 * Used by:
 * - add-game feature (manual game addition)
 * - view-imported-games feature (Steam game import)
 */
export const addGameToCollection = authorizedActionClient
  .metadata({
    actionName: "addGameToCollection",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      game: z.object({
        igdbId: z.number(),
      }),
      backlogItem: z.object({
        backlogStatus: z.nativeEnum(BacklogItemStatus),
        acquisitionType: z.nativeEnum(AcquisitionType),
        platform: z.string().optional(),
      }),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const { game, backlogItem } = parsedInput;

    const savedGame = await addGameToUserBacklog({
      userId,
      igdbId: game.igdbId,
      backlogItem: {
        status: backlogItem.backlogStatus,
        platform: backlogItem.platform,
        acquisitionType: backlogItem.acquisitionType,
      },
    });

    return savedGame;
  });
