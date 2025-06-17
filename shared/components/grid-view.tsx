import type { GameWithBacklogItems } from "@/features/dashboard/server-actions/get-user-games-with-grouped-backlog";
import { BacklogItemCard } from "@/shared/components/backlog-item-card";
import { GameCard } from "./game-card";

export function GridView({
  backlogItems,
}: {
  backlogItems: GameWithBacklogItems[];
}) {
  return (
    <ul className="grid grid-cols-6 gap-2">
      {backlogItems.map(({ game, backlogItems }) => (
        <GameCard
          key={game.id}
          game={game}
          platforms={backlogItems}
          currentPlatform={backlogItems[0] || undefined}
          displayMode={"combined"}
        />
        // <BacklogItemCard
        //   key={game.id}
        //   game={{
        //     id: game.id,
        //     title: game.title,
        //     coverImage: game.coverImage,
        //     igdbId: game.igdbId,
        //   }}
        //   backlogItems={backlogItems}
        //   hasActions={true}
        //   isExternalGame={false}
        //   isFromSharedWishlist={false}
        // />
      ))}
    </ul>
  );
}
