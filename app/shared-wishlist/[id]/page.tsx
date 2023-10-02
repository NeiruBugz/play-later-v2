import Image from "next/image"
import Link from "next/link"
import { getUserById } from "@/features/auth/actions"
import { getWishlistedGames } from "@/features/wishlist/actions"

import { Button } from "@/components/ui/button"

type SharedWishlistPageProps = {
  params: {
    id: string
  }
  searchParams: URLSearchParams
}
export default async function SharedWishlistPage(
  props: SharedWishlistPageProps
) {
  const [username, games] = await Promise.all([
    getUserById(props.params.id),
    getWishlistedGames(props.params.id),
  ])
  return (
    <main className="flex-1">
      <header className="sticky top-0 z-10 bg-background px-16 py-4 shadow-sm">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          {username}&apos;s Wishlist
        </h1>
      </header>
      <section className="mt-4 px-16 pb-16">
        <ul className="columns-2 gap-8 md:columns-3 lg:columns-4">
          {games.map((game) => (
            <li className="group relative mb-4 w-fit cursor-pointer rounded-md">
              <Image
                width={1000}
                height={1000}
                src={game.imageUrl}
                alt={`${game.title}`}
                className="h-auto w-auto rounded-md"
                priority
              />
              <section className="absolute left-0 top-0 hidden h-full w-full rounded-md bg-black/25 p-6 group-hover:block">
                <p className="text-xl font-bold text-white">{game.title}</p>
                <section className="mt-6 flex flex-col gap-2">
                  <Link
                    href={`https://www.amazon.com/s?k=${encodeURIComponent(
                      game.title
                    )}`}
                    target="_blank"
                  >
                    <Button variant="secondary">Buy on Amazon</Button>
                  </Link>
                  <Link
                    href={`https://store.playstation.com/en-us/search/${encodeURIComponent(
                      game.title
                    )}`}
                    target="_blank"
                  >
                    <Button variant="secondary">Buy on PS Store</Button>
                  </Link>
                </section>
              </section>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
