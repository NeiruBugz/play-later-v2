import type { UpcomingReleaseResponse } from "@/shared/types";

export const getUpcomingWishlistGamesWithBacklogId = (
  wishlistedGames: Array<{ id: number; game: { igdbId: number | null } }>,
  releases: UpcomingReleaseResponse[]
): Array<{ gameId: number } & UpcomingReleaseResponse> => {
  return releases
    .map((release) => {
      const backlogItem = wishlistedGames.find(
        (item) => item.game.igdbId === release.id
      );
      if (!backlogItem) return null;
      return {
        ...release,
        gameId: backlogItem.id,
      };
    })
    .filter(
      (game): game is { gameId: number } & UpcomingReleaseResponse => !!game
    );
};
