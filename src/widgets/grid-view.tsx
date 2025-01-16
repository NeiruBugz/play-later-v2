import type { GameWithBacklogItems } from "@/slices/backlog/api/get/get-user-games-with-grouped-backlog";
import { BacklogItemCard } from "@/slices/shared/widgets/backlog-item-card";

export function GridView({
  backlogItems,
}: {
  backlogItems: GameWithBacklogItems[];
}) {
  return (
    <ul className="grid grid-cols-6 gap-2">
      {backlogItems.map(({ game, backlogItems }) => (
        <BacklogItemCard
          key={game.id}
          game={{
            id: game.id,
            title: game.title,
            coverImage: game.coverImage,
            igdbId: game.igdbId,
          }}
          backlogItems={backlogItems}
          hasActions={true}
          isExternalGame={false}
          isFromSharedWishlist={false}
        />
      ))}
    </ul>
  );
}
