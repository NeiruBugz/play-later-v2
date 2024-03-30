import type { List as ListSchema } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/back-link";

import { Card } from "@/app/(features)/(protected)/library/components/game/ui/card/card";
import { List } from "@/app/(features)/(protected)/library/components/library/page/list";
import {
  getAllGames,
  getListGames,
} from "@/app/(features)/(protected)/library/lib/actions";
import { AddGameDialog } from "@/app/(features)/(protected)/lists/components/add-game-dialog";
import { DeleteDialog } from "@/app/(features)/(protected)/lists/components/delete-dialog";
import { getList } from "@/app/(features)/(protected)/lists/lib/actions";

export default async function ListPage({
  params,
}: {
  params: { id: ListSchema["id"] };
}) {
  const { id } = params;
  const [listData, games, allGames] = await Promise.all([
    getList(id),
    getListGames(id),
    getAllGames(),
  ]);

  return (
    <section>
      <header className="container sticky top-0 z-40 bg-background">
        <div className="flex flex-wrap justify-between">
          <BackLink>
            <Button
              variant="outline"
              className="h-full px-2 py-1 md:px-4 md:py-2"
            >
              <ArrowLeft />
            </Button>
          </BackLink>
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            {listData?.name}
          </h1>
          <DeleteDialog id={id} listName={listData?.name ?? ""} />
        </div>
      </header>
      <section className="container flex flex-wrap gap-2">
        <List>
          <AddGameDialog id={listData?.id ?? ""} games={allGames} />
          {games.map((game) => (
            <div key={game.id} className="relative">
              <Card game={game} path="lists" entityId={listData?.id} />
            </div>
          ))}
        </List>
      </section>
    </section>
  );
}
