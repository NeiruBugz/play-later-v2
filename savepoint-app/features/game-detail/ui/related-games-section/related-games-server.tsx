import { getFranchiseGames } from "@/features/game-detail/use-cases/get-franchise-games";

import { RelatedGamesClient } from "./related-games-client";

type Props = {
  igdbId: number;
  franchiseIds: number[];
};

export async function RelatedGamesServer({ igdbId, franchiseIds }: Props) {
  if (franchiseIds.length === 0) {
    return null;
  }

  const result = await getFranchiseGames({ igdbId, franchiseIds });

  if (!result.success || result.data.length === 0) {
    return null;
  }

  // Pass server-fetched data to client component
  return <RelatedGamesClient igdbId={igdbId} franchises={result.data} />;
}
