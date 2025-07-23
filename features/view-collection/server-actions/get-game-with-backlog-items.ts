"use server";

import {
  buildCollectionFilter,
  findGamesWithBacklogItemsPaginated,
} from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { FilterParamsSchema } from "../lib/validation";

const ITEMS_PER_PAGE = 24;
const DEFAULT_PAGE = 1;

export const getUserGamesWithGroupedBacklogPaginated = authorizedActionClient
  .metadata({
    actionName: "getUserGamesWithGroupedBacklogPaginated",
    requiresAuth: true,
  })
  .inputSchema(FilterParamsSchema)
  .action(async ({ ctx: { userId }, parsedInput }) => {
    try {
      const { gameFilter } = buildCollectionFilter({
        userId,
        ...parsedInput,
      });

      const [games, totalGames] = await findGamesWithBacklogItemsPaginated({
        where: gameFilter,
        page: parsedInput.page || DEFAULT_PAGE,
        itemsPerPage: ITEMS_PER_PAGE,
      });

      return {
        collection: games.map((game) => ({
          game,
          backlogItems: game.backlogItems,
        })),
        count: totalGames,
      };
    } catch (error) {
      throw new Error("Failed to fetch user game collection", { cause: error });
    }
  });
