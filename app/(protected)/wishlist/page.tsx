import { GameCard } from "@/features/game/ui/game-card"
import { getWishlistedGames } from "@/features/wishlist/actions"

export default async function WishlistPage() {
  const wishlist = await getWishlistedGames()
  return (
    <section>
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
        Wishlist
      </h1>
      <section className="mt-4 h-full space-y-6">
        {!wishlist || wishlist.length === 0 ? <h2>Wishlist is empty</h2> : null}
        {wishlist.map((game) => (
          <GameCard key={game.id} game={game} path="wishlist" />
        ))}
      </section>
    </section>
  )
}
