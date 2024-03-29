import { GameCard } from "@/features/game/ui/game-card";
import { WishlistShare } from "@/features/game/ui/wishlist-share";
import { List } from "@/features/library/ui/list";
import { getGamesFromWishlist } from "@/features/wishlist/actions";

import { RenderWhen } from "@/components/render-when";

export default async function WishlistPage() {
  const wishlist = await getGamesFromWishlist();
  return (
    <section className="container bg-background">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          Wishlist
        </h1>
        <RenderWhen condition={wishlist.length !== 0}>
          <WishlistShare />
        </RenderWhen>
      </header>
      <section className="mt-4 flex h-full flex-wrap gap-4">
        <RenderWhen condition={!wishlist || wishlist.length === 0}>
          <h2>Wishlist is empty</h2>
        </RenderWhen>
        <List>
          {wishlist.map((game) => (
            <GameCard key={game.id} game={game} path="wishlist" />
          ))}
        </List>
      </section>
    </section>
  );
}
