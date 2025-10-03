import { cache } from "react";

import { getCurrentlyExploringGames } from "@/features/dashboard/server-actions/get-user-games-with-grouped-backlog";
import { LibraryItemCard } from "@/shared/components/library-item-card";

const getCurrentlyPlayingGames = cache(async () =>
  getCurrentlyExploringGames()
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
          const { game, libraryItems } = playingItem;
          return (
            <LibraryItemCard
              key={game.id}
              hasActions={false}
              game={{
                id: game.id,
                title: game.title,
                coverImage: game.coverImage,
                igdbId: game.igdbId,
              }}
              libraryItems={libraryItems}
            />
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center gap-3">
          <p>No currently exploring games</p>
        </div>
      )}
    </div>
  );
}
