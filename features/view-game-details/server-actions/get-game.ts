import { z } from "zod";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const getGame = authorizedActionClient
  .metadata({
    actionName: "getGame",
    requiresAuth: true,
  })
  .inputSchema(
    z.object({
      id: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    const game = await prisma.game.findUnique({
      where: {
        id: parsedInput.id,
      },
      select: {
        id: true,
        title: true,
        igdbId: true,
        description: true,
        coverImage: true,
        mainStory: true,
        mainExtra: true,
        completionist: true,
        releaseDate: true,
        steamAppId: true,
        backlogItems: {
          orderBy: {
            updatedAt: "desc",
          },
        },
        Review: true,
      },
    });

    return game;
  });
