import { IgdbImage } from "@/src/shared/ui/igdb-image";
import type { BacklogItem } from "@prisma/client";
import Link from "next/link";

type GameCardProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  backlogItems?: Omit<BacklogItem, "game">[];
  isFromSharedWishlist?: boolean;
};

export function BacklogItemCard({
  game,
  backlogItems,
  isFromSharedWishlist,
}: GameCardProps) {
  if (isFromSharedWishlist) {
    return (
      <div className="group relative w-full max-w-[300px] cursor-pointer overflow-hidden rounded shadow-lg hover:border hover:shadow-xl">
        <div className="absolute top-0 z-10 hidden h-[208px] w-full flex-grow flex-col items-center justify-center rounded bg-slate-400 opacity-0 transition-opacity ease-in-out group-hover:flex group-hover:opacity-95">
          <p className="text-center text-[16px] font-bold text-white">
            {game.title}
          </p>
        </div>
        <IgdbImage
          width={156}
          height={220}
          className="object-cover"
          gameTitle={game.title}
          coverImageId={game.coverImage}
          igdbSrcSize={"hd"}
          igdbImageSize={"hd"}
        />
      </div>
    );
  }

  return (
    <Link href={`/game/${game.id}`}>
      <div className="group relative w-full cursor-pointer overflow-hidden rounded">
        <div className="absolute top-0 z-10 hidden h-full w-full flex-grow flex-col items-center justify-center rounded bg-slate-400 opacity-0 transition-opacity ease-in-out group-hover:flex group-hover:opacity-95">
          <p className="text-center font-medium text-white">{game.title}</p>
        </div>
        <IgdbImage
          width={120}
          height={200}
          className="object-cover"
          gameTitle={game.title}
          coverImageId={game.coverImage}
          igdbSrcSize={"hd"}
          igdbImageSize={"hd"}
        />
      </div>
    </Link>
  );
}
