"use server";

import { IgdbService } from "@/data-access-layer/services";
import { cache } from "react";

import { FRANCHISE_GAMES_INITIAL_LIMIT } from "@/shared/constants";
import { createLogger } from "@/shared/lib/app/logger";
import { LOGGER_CONTEXT } from "@/shared/lib/app/logger-context";

const logger = createLogger({
  [LOGGER_CONTEXT.USE_CASE]: "getFranchiseGames",
});
type FranchiseGame = {
  id: number;
  name: string;
  slug: string;
  cover?: {
    image_id: string;
  };
};
type FranchiseData = {
  franchiseId: number;
  franchiseName: string;
  games: FranchiseGame[];
  hasMore: boolean;
  totalCount: number;
};
type GetFranchiseGamesInput = {
  igdbId: number;
  franchiseIds: number[];
};
type GetFranchiseGamesResult =
  | { success: true; data: FranchiseData[] }
  | { success: false; error: string };

export const getFranchiseGames = cache(async function getFranchiseGames(
  input: GetFranchiseGamesInput
): Promise<GetFranchiseGamesResult> {
  const { igdbId, franchiseIds } = input;
  logger.info(
    { igdbId, franchiseCount: franchiseIds.length },
    "Fetching franchise games"
  );
  if (franchiseIds.length === 0) {
    logger.debug("No franchise IDs provided, returning empty result");
    return { success: true, data: [] };
  }
  try {
    const igdbService = new IgdbService();
    const franchises: FranchiseData[] = [];

    for (const franchiseId of franchiseIds) {
      const [detailsResult, gamesResult] = await Promise.all([
        igdbService.getFranchiseDetails({ franchiseId }),
        igdbService.getFranchiseGames({
          franchiseId,
          currentGameId: igdbId,
          limit: FRANCHISE_GAMES_INITIAL_LIMIT,
          offset: 0,
        }),
      ]);

      if (!detailsResult.success) {
        logger.warn(
          { franchiseId, error: detailsResult.error },
          "Failed to fetch franchise details"
        );
        continue;
      }
      if (!gamesResult.success) {
        logger.warn(
          { franchiseId, error: gamesResult.error },
          "Failed to fetch franchise games"
        );
        continue;
      }
      if (gamesResult.data.games.length > 0) {
        franchises.push({
          franchiseId,
          franchiseName: detailsResult.data.franchise.name,
          games: gamesResult.data.games,
          hasMore: gamesResult.data.pagination.hasMore,
          totalCount: gamesResult.data.pagination.total,
        });
      }
    }
    logger.info(
      {
        franchiseCount: franchises.length,
        totalGames: franchises.reduce((acc, f) => acc + f.games.length, 0),
      },
      "Successfully fetched franchise games"
    );
    return { success: true, data: franchises };
  } catch (error) {
    logger.error(
      { error, igdbId, franchiseIds },
      "Unexpected error fetching franchise games"
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
