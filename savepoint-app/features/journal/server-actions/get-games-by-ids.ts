"use server";

import { findGamesByIds } from "@/data-access-layer/repository";
import { z } from "zod";

import { createServerAction } from "@/shared/lib";

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

    const games = await findGamesByIds(gameIds);

    logger.info({ gamesCount: games.length }, "Games fetched successfully");
    return {
      success: true,
      data: games,
    };
  },
});
