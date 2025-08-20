import { type BacklogItemWithGame, type GameWithBacklogItems } from "../types";

export function groupWishlistedItemsByGameId({
  wishlisted,
}: {
  wishlisted: BacklogItemWithGame[];
}) {
  return wishlisted.reduce(
    (acc: Record<string, GameWithBacklogItems>, item) => {
      const { game, ...backlogItem } = item;
      if (!acc[game.id]) {
        acc[game.id] = { game, backlogItems: [] };
      }
      acc[game.id].backlogItems.push(backlogItem);
      return acc;
    },
    {}
  );
}
