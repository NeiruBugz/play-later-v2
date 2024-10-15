import { BacklogItemCard } from "@/src/entities/backlog-item";
import { GameWithBacklogItems } from "@/src/entities/backlog-item/model/get-backlog-items";

export function GridView({
  backlogItems,
}: {
  backlogItems: GameWithBacklogItems[];
}) {
  return (
    <ul className="my-4 grid h-fit grid-cols-[repeat(auto-fit,_minmax(100px,_1fr))] justify-between gap-4 overflow-auto">
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
