import { auth } from "@/auth";
import { RenderWhen } from "@/src/components/render-when";
import { Card } from "@/src/components/shared/game-card/card";
import { WishlistShare } from "@/src/components/wishlist/wishlist-share";
import { cn } from "@/src/packages/utils";
import { getGamesFromWishlist } from "@/src/queries/wishlist/get-games-from-wishlist";
import { redirect } from "next/navigation";

export default async function WishlistPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }
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
        <section className="flex w-full flex-col">
          <section
            className={cn(
              "mt-4 flex flex-wrap justify-center gap-2 md:justify-start"
            )}
          >
            {wishlist.map((game) => (
              <Card game={game} key={game.id} path="wishlist" />
            ))}
          </section>
        </section>
      </section>
    </section>
  );
}
