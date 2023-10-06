import { Metadata, ResolvingMetadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getUserById } from "@/features/auth/actions"
import { WishlistedGameShared } from "@/features/game/ui/wishlisted-game.shared"
import { getWishlistedGames } from "@/features/wishlist/actions"

import { Button } from "@/components/ui/button"

type SharedWishlistPageProps = {
  params: {
    id: string
  }
  searchParams: URLSearchParams
}

export async function generateMetadata(
  { params, searchParams }: SharedWishlistPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  const user = await getUserById(id)

  return {
    title: `${user}'s Wishlist`,
  }
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
      <header className="sticky top-0 z-10 bg-background p-4 shadow-sm md:px-16">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          {username}&apos;s Wishlist
        </h1>
      </header>
      <section className="mt-4 px-4 pb-16 md:px-16">
        <ul className="columns-2 md:columns-3 md:gap-8 lg:columns-4">
          {games.map((game) => (
            <li className="group relative mb-4 w-fit cursor-pointer rounded-md">
              <WishlistedGameShared game={game} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}