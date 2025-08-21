import { cache } from "react";

import { getCurrentlyPlayingGamesInBacklog } from "@/features/dashboard/server-actions/get-user-games-with-grouped-backlog";
import { GameCard } from "@/shared/components/game-card";
import { Body } from "@/shared/components/typography";

const getCurrentlyPlayingGames = cache(async () =>
  getCurrentlyPlayingGamesInBacklog()
);

export async function CurrentlyPlayingList() {
  const { data: currentlyPlayingGames, serverError } =
    await getCurrentlyPlayingGames();

  if (serverError) {
    return <Body variant="muted">Couldn&apos;t load games.</Body>;
  }

  return (
    <div className="flex w-full gap-3 overflow-x-auto pb-2">
      {currentlyPlayingGames?.length ? (
        currentlyPlayingGames.map((playingItem) => {
          const { game, backlogItems } = playingItem;
          return (
            <div key={game.id} className="w-40 shrink-0">
              <GameCard
                game={game}
                backlogItem={
                  backlogItems.length > 0 ? backlogItems[0] : undefined
                }
              />
            </div>
          );
        })
      ) : (
        <Body variant="muted">No currently playing games.</Body>
      )}
    </div>
  );
}
