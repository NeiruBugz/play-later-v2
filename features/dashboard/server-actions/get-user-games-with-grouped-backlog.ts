"use server";

import { findCurrentlyPlayingGames } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { groupLibraryItemsByGame } from "../lib/group-backlog-items-by-game";

export const getCurrentlyExploringGames = authorizedActionClient
  .metadata({
    actionName: "getCurrentlyExploringGames",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const userGames = await findCurrentlyPlayingGames({ userId });
    if (userGames.length === 0) {
      return [];
    }

    return groupLibraryItemsByGame(userGames);
  });
