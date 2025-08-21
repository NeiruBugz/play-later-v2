import { type BacklogItem } from "@prisma/client";

import { type GameWithBacklogItems } from "../types";

export const groupBacklogItemsByGame = (
  userGames: Array<BacklogItem & { game: GameWithBacklogItems["game"] }>
): GameWithBacklogItems[] => {
  const groupedGames = new Map<string, GameWithBacklogItems>();

  userGames.forEach(({ game, ...backlogItem }) => {
    if (!groupedGames.has(game.id)) {
      groupedGames.set(game.id, { game, backlogItems: [] });
    }
    groupedGames.get(game.id)!.backlogItems.push(backlogItem);
  });

  if (groupedGames.size === 0) {
    return [];
  }

  return Array.from(groupedGames.values());
};
