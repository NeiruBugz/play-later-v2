"use server";

import { z } from "zod";

import { GameService } from "@/data-access-layer/services";

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

    const gameService = new GameService();
    const result = await gameService.getGamesByIds({ ids: gameIds });

    if (!result.success) {
      logger.error({ error: result.error }, "Failed to fetch games");
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info({ gamesCount: result.data.length }, "Games fetched successfully");
    return {
      success: true,
      data: result.data,
    };
  },
});
