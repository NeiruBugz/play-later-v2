import { Card } from "@/features/game/ui/card/card";
import { List } from "@/features/library/ui/list";

import { LibraryContentProps } from "@/types/library";

function EmptyBacklog() {
  return (
    <p className="text-lg font-bold">Congratulations! Your backlog is empty!</p>
  );
}

function BacklogList({
  count,
  backlogTime,
}: {
  count: number;
  backlogTime: number;
}) {
  if (count === 0) {
    return <EmptyBacklog />;
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-lg font-bold">
        Total backlog time is {backlogTime} hours and includes {count} game(s)
      </p>
    </div>
  );
}

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
          <BacklogList
            count={backloggedLength}
            backlogTime={totalBacklogTime}
          />
        ) : null}
        <List>
          {list.map((game) => (
            <Card key={game.id} game={game} />
          ))}
        </List>
      </div>
    );
  }

  return (
    <div>
      {currentStatus === "BACKLOG" ? (
        <BacklogList count={backloggedLength} backlogTime={totalBacklogTime} />
      ) : null}
      <List>
        {[...list.entries()].map(([, games]) => {
          return games.map((game) => <Card key={game.id} game={game} />);
        })}
      </List>
    </div>
  );
}
