"use server";

import { z } from "zod";

import { createServerAction } from "@/shared/lib";
import { prisma } from "@/shared/lib/app/db";

const GetGamesByIdsSchema = z.object({
  gameIds: z.array(z.string()).min(1),
});

interface GameInfo {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
}

export const getGamesByIdsAction = createServerAction<
  z.infer<typeof GetGamesByIdsSchema>,
  GameInfo[]
>({
  actionName: "getGamesByIdsAction",
  schema: GetGamesByIdsSchema,
  requireAuth: true,
  handler: async ({ input, logger }) => {
    const { gameIds } = input;
    logger.info({ gameIdsCount: gameIds.length }, "Fetching games by IDs");

    try {
      const games = await prisma.game.findMany({
        where: {
          id: { in: gameIds },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
        },
      });

      logger.info({ gamesCount: games.length }, "Games fetched successfully");
      return {
        success: true,
        data: games,
      };
    } catch (error) {
      logger.error({ error }, "Failed to fetch games");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch games",
      };
    }
  },
});


