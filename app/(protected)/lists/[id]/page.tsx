import { GameCard } from "@/features/game/ui/game-card"
import { getAllGames, getListGames } from "@/features/library/actions"
import { ListWrapper } from "@/features/library/ui/list-wrapper"
import { getList } from "@/features/lists"
import { AddGameDialog } from "@/features/lists/add-game-dialog"
import { DeleteDialog } from "@/features/lists/delete-dialog"
import { List } from "@prisma/client"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BackLink } from "@/components/back-link"

export default async function ListPage({
  params,
}: {
  params: { id: List["id"] }
}) {
  const { id } = params
  const [listData, games, allGames] = await Promise.all([
    getList(id),
    getListGames(id),
    getAllGames(),
  ])

  return (
    <section>
      <header className="sticky top-0 z-40 bg-background p-4 md:container">
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
      <section className="flex flex-wrap gap-2 p-4 md:container">
        <ListWrapper count={games.length}>
          <AddGameDialog id={listData?.id ?? ""} games={allGames} />
          {games.map((game) => (
            <GameCard game={game} key={game.id} />
          ))}
        </ListWrapper>
      </section>
    </section>
  )
}
