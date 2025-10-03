import { type GameWithLibraryItems, type LibraryItemWithGame } from "../types";

export function groupWishlistedItemsByGameId({
  wishlisted,
}: {
  wishlisted: LibraryItemWithGame[];
}) {
  return wishlisted.reduce(
    (acc: Record<string, GameWithLibraryItems>, item) => {
      const { game, ...libraryItem } = item;
      if (!acc[game.id]) {
        acc[game.id] = { game, libraryItems: [] };
      }
      acc[game.id].libraryItems.push(libraryItem);
      return acc;
    },
    {}
  );
}
