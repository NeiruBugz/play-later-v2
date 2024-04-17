import Image from "next/image";
import Link from "next/link";
import { Game } from "@prisma/client";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import igdbApi from "@/lib/igdb-api";
import { GenresResponse } from "@/lib/types/igdb";

import { GameTimeBadge } from "@/app/(protected)/library/components/game/ui/card/time-badge";
import { QuickActions } from "@/app/(protected)/library/components/library/page/list-item/quick-actions";

export const ListItem = async ({
  game,
  currentStatus,
}: {
  game: Game;
  currentStatus: string;
}) => {
  let info: GenresResponse | null = null;
  const gameInfo = await igdbApi.getGameGenres(game.igdbId);
  if (gameInfo) {
    info = gameInfo[0];
  }

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Link href={`/library/${game.id}`}>
        <div className="flex gap-4">
          <Image
            src={`${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${game.imageUrl}.png`}
            alt={`${game.title} thumbnail`}
            width={90}
            height={90}
            className="rounded-md"
            priority
          />
          <div className="self-center justify-self-start md:min-w-[260px] lg:min-w-[400px] xl:min-w-[600px]">
            <h2 className="whitespace-pre-wrap text-2xl font-bold tracking-tight">
              {game.title}
            </h2>
            <div className="mt-1 flex flex-wrap gap-2">
              {info?.genres.map((genre) => (
                <Badge
                  key={genre.id}
                  className="max-h-fit rounded"
                  variant="outline"
                >
                  {genre.name}
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <GameTimeBadge time={game.gameplayTime} />
            </div>
          </div>
        </div>
      </Link>
      <div className="flex gap-4 xl:gap-8">
        <div className="hidden self-center lg:block">
          <p className="mb-2 flex items-center gap-1 whitespace-nowrap text-xs leading-none text-foreground text-slate-600">
            <Calendar className="mr-1 size-4" />
            Added on&nbsp;
            {game.createdAt ? format(game.createdAt, "dd MMM, yyyy") : "-"}
          </p>
          <p className="flex items-center gap-1 whitespace-nowrap text-xs leading-none text-foreground text-slate-600">
            <Calendar className="mr-1 size-4" />
            Last update&nbsp;
            {game.updatedAt ? format(game.updatedAt, "dd MMM, yyyy") : "-"}
          </p>
        </div>
        <QuickActions currentStatus={currentStatus} id={game.id} />
      </div>
    </div>
  );
};
