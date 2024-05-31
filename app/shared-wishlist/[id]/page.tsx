import { Metadata } from "next";
import { notFound } from "next/navigation";

import { SharedWishlistPageProps } from "@/src/shared/types/wishlist";
import { WishlistedGameShared } from "@/src/widgets/wishlisted-game.shared";

import { getGamesFromWishlist } from "@/src/entities/game/api/get-games-from-wishlist";
import { getUserById } from "@/src/entities/user/api/get-user-by-id";

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: SharedWishlistPageProps): Promise<Metadata> {
  const id = params.id;
  const user = await getUserById(id);

  return {
    title: `${user}'s Wishlist`,
  };
}

export default async function SharedWishlistPage(
  props: SharedWishlistPageProps
) {
  const username = await getUserById(props.params.id);
  const games = await getGamesFromWishlist(props.params.id);

  if (!games.length) {
    notFound();
  }

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
            <li
              className="group relative mb-4 w-fit cursor-pointer rounded-md"
              key={game.id}
            >
              <WishlistedGameShared game={game} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
