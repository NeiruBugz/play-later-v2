import "server-only";

import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { z } from "zod";

import { addGameToUserBacklog } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const saveGameAndAddToBacklog = authorizedActionClient
  .metadata({
    actionName: "saveGameAndAddToBacklog",
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
