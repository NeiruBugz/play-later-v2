import { IMAGE_API, IMAGE_SIZES } from "@/src/shared/config/image.config";
import {
  BacklogStatusMapper,
  cn,
  normalizeString,
  platformToBackgroundColor,
} from "@/src/shared/lib";
import { Badge } from "@/src/shared/ui/badge";
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
        <Image
          src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.coverImage}.png`}
          alt={`${game.title} cover art`}
          width={156}
          height={220}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <Link href={`/game/${game.id}`}>
      <div className="group relative w-full max-w-[300px] cursor-pointer overflow-hidden rounded shadow-lg hover:border hover:shadow-xl">
        <div className="absolute top-0 z-10 hidden h-[208px] w-full flex-grow flex-col items-center justify-center rounded bg-slate-400 opacity-0 transition-opacity ease-in-out group-hover:flex group-hover:opacity-95">
          <p className="text-center text-[16px] font-bold text-white">
            {game.title}
          </p>
          <div className="mt-1 flex flex-col gap-1">
            {backlogItems?.map((item) =>
              item.status && item.platform ? (
                <div
                  key={item.id}
                  className="text-center text-xs font-medium text-white"
                >
                  <Badge className="px-0.5">
                    {BacklogStatusMapper[item.status]}
                  </Badge>
                  &nbsp;|&nbsp;
                  <Badge
                    className={cn(
                      "px-0.5",
                      platformToBackgroundColor(item.platform)
                    )}
                  >
                    {normalizeString(item.platform as string)}
                  </Badge>
                </div>
              ) : null
            )}
          </div>
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
