import { IMAGE_API, IMAGE_SIZES } from "@/src/shared/config/image.config";
import { BacklogItem } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type GameCardProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  backlogItems?: Omit<BacklogItem, "game">[];
};

export function BacklogItemCard({ game }: GameCardProps) {
  return (
    <Link href={`/game/${game.id}`}>
      <div className="group relative w-full max-w-[300px] cursor-pointer overflow-hidden rounded shadow-lg transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:border hover:shadow-xl">
        <div className="absolute top-0 z-10 hidden h-[209px] w-full flex-grow items-center justify-center rounded bg-slate-400 opacity-0 transition-opacity ease-in-out group-hover:flex group-hover:opacity-95">
          <p className="text-center text-[16px] font-bold text-white">
            {game.title}
          </p>
        </div>
        <Image
          src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.coverImage}.png`}
          alt={`${game.title} cover art`}
          width={156}
          height={220}
          className="object-cover"
        />
      </div>
    </Link>
  );
}
