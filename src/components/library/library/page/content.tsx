import { Card } from "@/src/components/library/game/ui/card/card";
import { ListItem } from "@/src/components/library/library/page/list-item/list-item";
import { List } from "@/src/components/shared/list";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { LibraryContentProps } from "@/src/types/library/components";

function EmptyBacklog() {
  return (
    <p className="text-lg font-bold">Congratulations! Your backlog is empty!</p>
  );
}

function BacklogList({
  backlogTime,
  count,
}: {
  backlogTime: number;
  count: number;
}) {
  if (count === 0) {
    return <EmptyBacklog />;
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-lg font-bold">
        Total backlog time is {backlogTime} hour(s)
      </p>
    </div>
  );
}

export async function LibraryContent({
  backloggedLength,
  currentStatus,
  list,
  totalBacklogTime,
  viewMode = "list",
}: { viewMode?: string } & LibraryContentProps) {
  return (
    <>
      {currentStatus === "BACKLOG" ? (
        <BacklogList backlogTime={totalBacklogTime} count={backloggedLength} />
      ) : null}
      <ScrollArea>
        <List viewMode={viewMode as "grid" | "list"}>
          {list.map((game) => {
            return viewMode === "list" ? (
              <ListItem
                currentStatus={currentStatus}
                game={game}
                key={game.id}
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
