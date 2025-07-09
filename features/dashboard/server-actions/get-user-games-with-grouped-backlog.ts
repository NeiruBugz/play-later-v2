"use server";

import { findCurrentlyPlayingGames } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { groupBacklogItemsByGame } from "../lib/group-backlog-items-by-game";

export const getCurrentlyPlayingGamesInBacklog = authorizedActionClient
  .metadata({
    actionName: "getCurrentlyPlayingGamesInBacklog",
    requiresAuth: true,
  })
  .action(async ({ ctx: { userId } }) => {
    const userGames = await findCurrentlyPlayingGames({ userId });
    if (userGames.length === 0) {
      return [];
    }

    return groupBacklogItemsByGame(userGames);
  });
