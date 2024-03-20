import Image from "next/image";
import Link from "next/link";
import { WishlistedGame } from "@prisma/client";

import { Button } from "@/components/ui/button";

export function WishlistedGameShared({ game }: { game: WishlistedGame }) {
  return (
    <>
      <Image
        width={1000}
        height={1000}
        src={game.imageUrl}
        alt={`${game.title}`}
        className="h-auto w-[150px] rounded-md md:w-[180px] xl:w-[300px] 2xl:w-[400px]"
        priority
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
