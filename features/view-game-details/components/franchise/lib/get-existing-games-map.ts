import type { Game } from "@prisma/client";

export const getExistingGamesMap = (existingGamesResult: Game[]) => {
  const existingGamesMap = new Map();
  if (!existingGamesResult) {
    return existingGamesMap;
  }

  existingGamesResult.forEach((game) => {
    existingGamesMap.set(game.igdbId, game);
  });

  return existingGamesMap;
};
