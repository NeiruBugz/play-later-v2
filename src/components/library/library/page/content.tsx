import {
  computeBacklogTime,
  getGamesListWithAdapter,
} from "@/src/actions/library/get-games";
import { ListItem } from "@/src/components/library/library/page/list-item/list-item";
import { Card } from "@/src/components/shared/game-card/card";
import { List } from "@/src/components/shared/list";
import { ScrollArea } from "@/src/components/ui/scroll-area";


const BacklogList = async () => {
  const { time} = await computeBacklogTime();
  if (time === 0) {
    return <p className="text-lg font-bold">Congratulations! Your backlog is empty!</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-lg font-bold">
        Total backlog time is {time} hour(s)
      </p>
    </div>
  );
}

export async function LibraryContent({
  searchParams,
}: { searchParams: URLSearchParams }) {
  const viewMode = searchParams?.get("viewMode") ?? "list";
  const currentStatus = searchParams?.get("status") ?? "INPROGRESS";
  const { list } = await getGamesListWithAdapter(searchParams)
  return (
    <>
      {currentStatus === "BACKLOG" ? (
        <BacklogList />
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
