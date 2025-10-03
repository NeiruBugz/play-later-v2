"use server";

import igdbApi from "@/shared/lib/igdb";
import { findUpcomingWishlistItems } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { getUpcomingWishlistGamesWithLibraryId } from "../lib/get-upcoming-wishlist-games-with-backlogId";

export const getUpcomingWishlistItems = authorizedActionClient
  .metadata({
    actionName: "getUpcomingWishlistItems",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    await igdbApi.getToken();

    if (!userId) {
      return [];
    }

    const wishlistedGames = await findUpcomingWishlistItems({ userId });

    if (!wishlistedGames) {
      return [];
    }

    const igdbIds = wishlistedGames
      .map((item) => item.game.igdbId)
      .filter((id): id is number => id !== null);

    if (igdbIds.length === 0) {
      return [];
    }

    const upcomingReleases = await igdbApi.getNextMonthReleases(igdbIds);

    if (!upcomingReleases || upcomingReleases.length === 0) {
      return [];
    }

    const games = getUpcomingWishlistGamesWithLibraryId(
      wishlistedGames,
      upcomingReleases
    );

    return games;
  });
