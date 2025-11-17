import { getFranchiseGames } from "@/features/game-detail/use-cases/get-franchise-games";

import { RelatedGamesClient } from "./related-games-client";
import type { RelatedGamesServerProps } from "./related-games-server.types";

export async function RelatedGamesServer({
  igdbId,
  franchiseIds,
}: RelatedGamesServerProps) {
  if (franchiseIds.length === 0) {
    return null;
  }
  const result = await getFranchiseGames({ igdbId, franchiseIds });
  if (!result.success || result.data.length === 0) {
    return null;
  }

  return <RelatedGamesClient igdbId={igdbId} franchises={result.data} />;
}
