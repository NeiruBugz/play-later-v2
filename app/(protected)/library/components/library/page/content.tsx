import { ScrollArea } from "@/components/ui/scroll-area";

import { LibraryContentProps } from "@/lib/types/library";

import { Card } from "@/app/(protected)/library/components/game/ui/card/card";
import { List } from "@/app/(protected)/library/components/library/page/list";
import { ListItem } from "@/app/(protected)/library/components/library/page/list-item/list-item";

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

export async function LibraryContent({
  currentStatus,
  backloggedLength,
  totalBacklogTime,
  list,
  viewMode = "list",
}: LibraryContentProps & { viewMode?: string }) {
  return (
    <>
      {currentStatus === "BACKLOG" ? (
        <BacklogList count={backloggedLength} backlogTime={totalBacklogTime} />
      ) : null}
      <ScrollArea>
        <List viewMode={viewMode as "list" | "grid"}>
          {list.map((game) => {
            return viewMode === "list" ? (
              <ListItem
                game={game}
                key={game.id}
                currentStatus={currentStatus}
              />
            ) : (
              <Card game={game} key={game.id} />
            );
          })}
        </List>
      </ScrollArea>
    </>
  );
}
