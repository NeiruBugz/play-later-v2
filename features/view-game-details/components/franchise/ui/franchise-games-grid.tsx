import { findManyByIgdbIds } from "@/shared/lib/repository";

import { getExistingGamesMap } from "../lib";
import type { FranchiseProps } from "../types";
import { FranchiseGame } from "./franchise-game";

export async function FranchiseGamesGrid({
  games,
}: Pick<FranchiseProps, "games">) {
  const igdbIds = games.map((game) => game.id);
  const existingGamesResult = await findManyByIgdbIds({ igdbIds });

  const existingGamesMap = getExistingGamesMap(existingGamesResult);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {games?.map((game) => {
        if (!game || !game.cover || !game.cover?.image_id) {
          return null;
        }

        const existingGame = existingGamesMap.get(game.id) || null;

        return (
          <FranchiseGame
            key={game.id}
            game={game}
            existingGame={existingGame}
          />
        );
      })}
    </div>
  );
}
