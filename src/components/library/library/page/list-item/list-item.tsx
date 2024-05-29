import type { GenresResponse } from "@/src/packages/types/igdb";
import type { ListEntry } from "@/src/types/library/actions";

import { QuickActions } from "@/src/components/library/library/page/list-item/quick-actions";
import { CustomImage } from "@/src/components/shared/custom-image";
import { GameTimeBadge } from "@/src/components/shared/game-card/time-badge";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { IMAGE_SIZES } from "@/src/packages/config/igdb.config";
import igdbApi from "@/src/packages/igdb-api";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const ListItem = async ({
  currentStatus,
  game,
  imageKey = "logo",
}: {
  currentStatus: string;
  game: ListEntry;
  imageKey?: keyof typeof IMAGE_SIZES;
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
          <CustomImage
            alt={`${game.title} thumbnail`}
            className="flex-shrink-0 rounded-md"
            imageUrl={game.imageUrl}
            size={imageKey}
          />
          <div className="self-center justify-self-start md:min-w-[260px] lg:min-w-[400px] xl:min-w-[600px]">
            <h2 className="whitespace-pre-wrap text-2xl font-bold tracking-tight">
              {game.title}
            </h2>
            <Suspense
              fallback={
                <>
                  <Skeleton className="h-6 w-8" />
                </>
              }
            >
              <div className="mt-1 flex flex-wrap gap-2">
                {info?.genres.map((genre) => (
                  <Badge
                    className="max-h-fit rounded"
                    key={genre.id}
                    variant="outline"
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </Suspense>
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
