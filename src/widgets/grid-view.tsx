import { BacklogItemCard } from "@/components/backlog/backlog-item-card";
import type { GameWithBacklogItems } from "@/features/backlog/actions/get/get-user-games-with-grouped-backlog";

export function GridView({
  backlogItems,
}: {
  backlogItems: GameWithBacklogItems[];
}) {
  return (
    <ul className="flex flex-wrap justify-center gap-3">
      {backlogItems.map(({ game, backlogItems }) => (
        <li key={game.id}>
          <BacklogItemCard
            game={{
              id: game.id,
              title: game.title,
              coverImage: game.coverImage,
              igdbId: game.igdbId,
            }}
            backlogItems={backlogItems}
          />
        </li>
      ))}
    </ul>
  );
}
