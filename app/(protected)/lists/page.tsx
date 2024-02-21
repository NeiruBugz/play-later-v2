import Image from "next/image"
import Link from "next/link"
import {
  getListGamesArtworks,
  getRandomGames,
} from "@/features/library/actions"
import { getLists } from "@/features/lists"
import { CreateList } from "@/features/lists/create-dialog"
import { Game, List } from "@prisma/client"

import { Label } from "@/components/ui/label"

async function getListGames(lists: List[]) {
  const artworksMap = new Map<
    List["id"],
    Array<{ id: Game["id"]; artwork: Game["imageUrl"]; game: Game["title"] }>
  >()
  if (lists.length === 0) {
    return artworksMap
  }

  for (const list of lists) {
    const games = await getListGamesArtworks(list.id)
    if (games.length) {
      artworksMap.set(list.id, games.slice(0, 6))
    }
  }

  return artworksMap
}

export default async function ListsPage() {
  const [lists, games] = await Promise.all([getLists(), getRandomGames()])
  const artworks = await getListGames(lists)

  return (
    <section>
      <header className="sticky top-0 z-40 bg-background p-4 md:container">
        <div className="flex flex-wrap justify-between">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Lists
          </h1>
        </div>
      </header>
      <section className="flex flex-col gap-2 p-4 md:container">
        <CreateList randomGames={games} />
        <div className="group flex flex-wrap gap-3">
          {lists.map((list) => {
            const arts = artworks.get(list.id)

            return (
              <Link
                href={`/lists/${list.id}`}
                key={list.id}
                className="relative size-fit rounded border p-4 group-hover:bg-secondary"
              >
                <div>
                  <Label className="group-hover:text-secondary-foreground">
                    {list.name}
                  </Label>
                  <div className="relative mt-1 grid w-fit grid-cols-3 gap-2">
                    {arts?.map((art) => (
                      <Image
                        key={art.id}
                        src={art.artwork}
                        width="80"
                        height="120"
                        alt={`${art.game} cover art`}
                      />
                    ))}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </section>
  )
}
