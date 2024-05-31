import type { Game } from "@prisma/client";

import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import igdbApi from "@/src/shared/api/igdb";
import { sessionErrorHandler } from "@/src/shared/lib/error-handlers";
import type { UpcomingReleaseResponse } from "@/src/shared/types";

export const getWishlistReleases = async () => {
  try {
    const session = await getServerUserId();

    if (!session) {
      sessionErrorHandler();
      return [];
    }

    const wishlistedGames = await db.game.findMany({
      select: {
        id: true,
        igdbId: true,
        imageUrl: true,
        title: true,
      },
      where: {
        isWishlisted: true,
        userId: session,
      },
    });

    if (!wishlistedGames) {
      return [];
    }

    const ids = wishlistedGames
      .map((game) => game.igdbId)
      .filter((id) => id !== null);

    const releases = await igdbApi.getNextMonthReleases(ids as number[]);

    if (!releases) {
      return [];
    }
    const games = [...releases] as unknown as Array<
      { gameId: Game["id"] } & UpcomingReleaseResponse
    >;

    for (const release of games) {
      const game: { gameId: Game["id"] } & UpcomingReleaseResponse = {
        ...release,
        gameId: "",
      };
      const id = wishlistedGames.find((game) => game.igdbId === release.id)?.id;
      if (id) {
        game.gameId = id;
      }
    }
    return games;
  } catch (error) {
    console.error(error);
    return [];
  }
};
