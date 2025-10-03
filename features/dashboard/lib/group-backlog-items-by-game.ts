import { type LibraryItem } from "@prisma/client";

import { type GameWithLibraryItems } from "../types";

export const groupLibraryItemsByGame = (
  userGames: Array<
    { game: GameWithLibraryItems["game"] } & Omit<LibraryItem, "game">
  >
): GameWithLibraryItems[] => {
  const groupedGames = new Map<string, GameWithLibraryItems>();

  userGames.forEach(({ game, ...libraryItem }) => {
    if (!groupedGames.has(game.id)) {
      groupedGames.set(game.id, { game, libraryItems: [] });
    }
    groupedGames.get(game.id)!.libraryItems.push(libraryItem);
  });

  if (groupedGames.size === 0) {
    return [];
  }

  return Array.from(groupedGames.values());
};
