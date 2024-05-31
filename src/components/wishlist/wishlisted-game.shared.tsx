import Link from "next/link";
import type { SharedWishlistGame } from "@/src/types/wishlist";
import { Button } from "@/src/shared/ui/button";
import { CustomImage } from "@/src/shared/ui/custom-image";

export function WishlistedGameShared({ game }: { game: SharedWishlistGame }) {
  return (
    <>
      <CustomImage
        alt={`${game.title}`}
        className="h-auto w-[150px] rounded-md md:w-[180px] xl:w-[300px] 2xl:w-[400px]"
        imageUrl={game.imageUrl}
        priority
        size="c-big"
      />
      <section className="absolute left-0 top-0 hidden size-full flex-col justify-between rounded-md bg-black/25 p-6 group-hover:flex">
        <p className="text-xl font-bold text-white">{game.title}</p>

        <Link
          href={`https://www.amazon.com/s?k=${encodeURIComponent(game.title)}`}
          target="_blank"
        >
          <Button variant="secondary">Buy on Amazon</Button>
        </Link>
      </section>
    </>
  );
}
