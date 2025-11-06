import { IgdbService } from "@/data-access-layer/services";

import { RelatedGamesClient } from "./related-games-client";

type Props = {
  igdbId: number;
  franchiseIds: number[];
};

export async function RelatedGamesServer({ igdbId, franchiseIds }: Props) {
  if (franchiseIds.length === 0) {
    return null;
  }

  const igdbService = new IgdbService();
  const franchises = [];

  // Fetch initial page (20 games) for each franchise in parallel
  for (const franchiseId of franchiseIds) {
    const [detailsResult, gamesResult] = await Promise.all([
      igdbService.getFranchiseDetails({ franchiseId }),
      igdbService.getFranchiseGames({
        franchiseId,
        currentGameId: igdbId,
        limit: 20,
        offset: 0,
      }),
    ]);

    if (
      detailsResult.success &&
      gamesResult.success &&
      gamesResult.data.games.length > 0
    ) {
      franchises.push({
        franchiseId,
        franchiseName: detailsResult.data.franchise.name,
        games: gamesResult.data.games,
        hasMore: gamesResult.data.pagination.hasMore,
        totalCount: gamesResult.data.pagination.total,
      });
    }
  }

  if (franchises.length === 0) {
    return null;
  }

  // Pass server-fetched data to client component
  return <RelatedGamesClient igdbId={igdbId} franchises={franchises} />;
}
