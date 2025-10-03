import { type GameWithLibraryItems } from "@/features/view-wishlist/types";

import { GameCard } from "./game-card";

export function GridView({
  libraryItems,
}: {
  libraryItems: GameWithLibraryItems[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {libraryItems.map(({ game, libraryItems }) => (
        <li key={game.id}>
          <GameCard
            game={game}
            platforms={libraryItems}
            currentPlatform={libraryItems[0]}
          />
        </li>
      ))}
    </ul>
  );
}
