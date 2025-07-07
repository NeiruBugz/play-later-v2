import { cache } from "react";

import { getUserGamesWithGroupedBacklog } from "@/features/dashboard/server-actions/get-user-games-with-grouped-backlog";
import { BacklogItemCard } from "@/shared/components/backlog-item-card";

const getCurrentlyPlayingGames = cache(
  async () =>
    await getUserGamesWithGroupedBacklog({
      status: "PLAYING",
    })
);

export async function CurrentlyPlayingList() {
  const { data: currentlyPlayingGames, serverError } =
    await getCurrentlyPlayingGames();

  if (serverError) {
    return <div>{serverError}</div>;
  }

  return (
    <div className="flex w-full max-w-[420px] justify-start gap-3 overflow-x-auto">
      {currentlyPlayingGames?.length ? (
        currentlyPlayingGames.map((playingItem) => {
          const { game, backlogItems } = playingItem;
          return (
            <BacklogItemCard
              key={game.id}
              hasActions={false}
              game={{
                id: game.id,
                title: game.title,
                coverImage: game.coverImage,
                igdbId: game.igdbId,
              }}
              backlogItems={backlogItems}
            />
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center gap-3">
          <p>No currently playing games</p>
        </div>
      )}
    </div>
  );
}
