import "server-only";

import { AcquisitionType, LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

import { addGameToUserLibrary } from "@/shared/lib/repository";
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
      libraryItem: z.object({
        libraryItemStatus: z.nativeEnum(LibraryItemStatus),
        acquisitionType: z.nativeEnum(AcquisitionType),
        platform: z.string().optional(),
      }),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const { game, libraryItem } = parsedInput;

    const savedGame = await addGameToUserLibrary({
      userId,
      igdbId: game.igdbId,
      libraryItem: {
        status: libraryItem.libraryItemStatus,
        platform: libraryItem.platform,
        acquisitionType: libraryItem.acquisitionType,
      },
    });

    return savedGame;
  });
