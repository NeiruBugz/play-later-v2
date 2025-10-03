import { type UpcomingReleaseResponse } from "@/shared/types";

export const getUpcomingWishlistGamesWithLibraryId = (
  wishlistedGames: Array<{ id: number; game: { igdbId: number | null } }>,
  releases: UpcomingReleaseResponse[]
): Array<{ gameId: number } & UpcomingReleaseResponse> => {
  return releases
    .map((release) => {
      const libraryItem = wishlistedGames.find(
        (item) => item.game.igdbId === release.id
      );
      if (!libraryItem) return null;
      return {
        ...release,
        gameId: libraryItem.id,
      };
    })
    .filter(
      (game): game is { gameId: number } & UpcomingReleaseResponse => !!game
    );
};
