import Link from "next/link"
import { getRandomGames } from "@/features/library/actions"
import { getLists } from "@/features/lists"
import { CreateList } from "@/features/lists/create-dialog"

export default async function ListsPage() {
  const [lists, games] = await Promise.all([getLists(), getRandomGames()])
  console.log(lists)
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
        {lists.map((list) => (
          <Link
            href={`/lists/${list.id}`}
            key={list.id}
            className="p-4 border w-fit"
          >
            {list.name}
          </Link>
        ))}
      </section>
    </section>
  )
}
