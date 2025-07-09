import { GameWithBacklogItems } from "@/features/view-wishlist/types";

import { GameCard } from "./game-card";

export function GridView({
  backlogItems,
}: {
  backlogItems: GameWithBacklogItems[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {backlogItems.map(({ game, backlogItems }) => (
        <li key={game.id}>
          <GameCard
            game={game}
            platforms={backlogItems}
            currentPlatform={backlogItems[0] || undefined}
            displayMode={"combined"}
          />
        </li>
      ))}
    </ul>
  );
}
