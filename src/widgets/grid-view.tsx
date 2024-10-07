import { BacklogItemCard } from "@/src/entities/backlog-item";
import { GameWithBacklogItems } from "@/src/entities/backlog-item/model/get-backlog-items";

export function GridView({
  backlogItems,
}: {
  backlogItems: GameWithBacklogItems[];
}) {
  return (
    <ul className="flex flex-wrap justify-center gap-3 overflow-scroll pb-4 md:justify-start">
      {backlogItems.map(({ game, backlogItems }) => (
        <li key={game.id}>
          <BacklogItemCard
            game={{
              id: game.id,
              title: game.title,
              coverImage: game.coverImage,
            }}
            backlogItems={backlogItems}
          />
        </li>
      ))}
    </ul>
  );
}
