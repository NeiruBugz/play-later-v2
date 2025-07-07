"use server";

import { prisma } from "@/shared/lib/db";
import igdbApi from "@/shared/lib/igdb";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { UpcomingReleaseResponse } from "@/shared/types";

export const getUpcomingWishlistItems = authorizedActionClient
  .metadata({
    actionName: "getUpcomingWishlistItems",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    try {
      await igdbApi.getToken();

      if (!userId) {
        return [];
      }

      const wishlistedGames = await prisma.backlogItem.findMany({
        where: {
          userId,
          status: "WISHLIST",
          game: {
            releaseDate: {
              gte: new Date(),
            },
          },
        },
        include: {
          game: {
            select: {
              igdbId: true,
              title: true,
              coverImage: true,
              releaseDate: true,
            },
          },
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

      if (!releases || !releases.length) {
        return [];
      }

      const games = [...(releases ?? [])] as unknown as Array<
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
  });
