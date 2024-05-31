import type { Game } from "@prisma/client";
import { WishlistShare } from "@/src/components/wishlist/wishlist-share";
import { Card } from "@/src/components/shared/game-card/card";
import { cn } from "@/src/shared/lib/tailwind-merge";
import { RenderWhen } from "@/src/shared/ui/render-when";

type WishlistProps = {
  wishlist: Array<Pick<Game, "id" | "imageUrl" | "gameplayTime" | "title">>;
};

export function Wishlist({ wishlist }: WishlistProps) {
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
