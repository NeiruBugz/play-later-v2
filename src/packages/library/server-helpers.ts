"use server";

import type { Game } from "@prisma/client";

import { HowLongToBeatService } from "howlongtobeat";
import { updateGame } from "@/src/actions/library/update-game";

export const updateBackloggedGames = async (backlogged: Game[]) => {
  for (const game of backlogged) {
    if (!game.gameplayTime && game.howLongToBeatId) {
      const hltbService = new HowLongToBeatService();
      const details = await hltbService.detail(game.howLongToBeatId);
      await updateGame(game.id, "gameplayTime", details?.gameplayMain);
    }
  }
};
