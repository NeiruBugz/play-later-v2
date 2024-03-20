import { GameCard } from "@/features/game/ui/game-card";
import { List } from "@/features/library/ui/list";

import { LibraryContentProps } from "@/types/library";

export function LibraryContent({
  currentStatus,
  totalBacklogTime,
  backloggedLength,
  list,
}: LibraryContentProps) {
  if (Array.isArray(list)) {
    return (
      <div>
        {currentStatus === "BACKLOG" ? (
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold">
              Total backlog time is {totalBacklogTime} hours and includes{" "}
              {backloggedLength} game(s)
            </p>
          </div>
        ) : null}
        <List count={backloggedLength}>
          {list.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </List>
      </div>
    );
  }

  return (
    <div>
      {currentStatus === "BACKLOG" ? (
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold">
            Total backlog time is {totalBacklogTime} hours and includes{" "}
            {backloggedLength} game(s)
          </p>
        </div>
      ) : null}
      <List count={backloggedLength}>
        {[...list.entries()].map(([year, games]) => {
          return games.map((game) => <GameCard key={game.id} game={game} />);
        })}
      </List>
    </div>
  );
}
