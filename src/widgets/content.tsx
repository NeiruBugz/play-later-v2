import { List } from "@/src/shared/ui/list";
import { ScrollArea } from "@/src/shared/ui/scroll-area";

import {
  computeBacklogTime,
  getGamesListWithAdapter,
} from "@/src/entities/game/api/get-games";

import { Card } from "@/src/widgets/game-card";

import { ListItem } from "./list-item";

const BacklogList = async () => {
  const { time } = await computeBacklogTime();
  if (time === 0) {
    return (
      <p className="text-lg font-bold">
        Congratulations! Your backlog is empty!
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-lg font-bold">Total backlog time is {time} hour(s)</p>
    </div>
  );
};

export async function LibraryContent({
  searchParams,
}: {
  searchParams: URLSearchParams;
}) {
  const viewMode = searchParams?.get("viewMode") ?? "list";
  const currentStatus = searchParams?.get("status") ?? "INPROGRESS";
  const { list } = await getGamesListWithAdapter(searchParams);
  return (
    <>
      {currentStatus === "BACKLOG" ? <BacklogList /> : null}
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
