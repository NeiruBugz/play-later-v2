import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import igdbApi from "@/src/shared/api/igdb";
import { UpcomingReleaseResponse } from "@/src/shared/types";

export async function getUpcomingWishlistItems() {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return [];
    }

    const wishlistedGames = await prisma.backlogItem.findMany({
      where: {
        userId,
        status: "WISHLIST",
      },
      include: {
        game: true,
      },
    });

    if (!wishlistedGames) {
      return [];
    }

    const ids = wishlistedGames
      .map((game) => game.game.igdbId)
      .filter((id) => id !== null);
    if (ids.length === 0) {
      return [];
    }
    const releases = await igdbApi.getNextMonthReleases(ids as number[]);

    if (!releases) {
      return [];
    }

    const games = [...releases] as unknown as Array<
      { gameId: number } & UpcomingReleaseResponse
    >;

    for (const releaseGame of games) {
      const game: { gameId: number } & UpcomingReleaseResponse = {
        ...releaseGame,
        gameId: 0,
      };
      const id = wishlistedGames.find(
        (game) => game.game.igdbId === releaseGame.id
      )?.id;
      if (id) {
        game.gameId = id;
      }
    }

    return games;
  } catch (error) {
    console.error("Error fetching upcoming wishlist items:", error);
    return [];
  }
}
