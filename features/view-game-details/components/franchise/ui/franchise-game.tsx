import { Game } from "@prisma/client";
import Link from "next/link";

import { IgdbImage } from "@/shared/components/igdb-image";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { FranchiseGamesResponse } from "@/shared/types";

export function FranchiseGameSkeleton() {
  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border">
        <Skeleton className="h-full w-full" />
      </div>
      <Skeleton className="mt-2 h-4 w-3/4" />
    </div>
  );
}

export function FranchiseGame({
  game,
  existingGame,
}: {
  game: FranchiseGamesResponse["games"][number];
  existingGame?: Game | null;
}) {
  const gameLink = existingGame
    ? `/game/${existingGame.id}`
    : `/game/external/${game.id}`;

  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border">
        <IgdbImage
          gameTitle={game.name}
          coverImageId={game.cover.image_id}
          igdbSrcSize={"hd"}
          igdbImageSize={"c-sm"}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />

        {existingGame && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]">
            <div className="absolute bottom-2 right-2 rounded bg-green-600/90 px-2 py-1 text-xs font-medium text-white">
              In Collection
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Button asChild variant="secondary" size="sm">
            <Link href={gameLink}>View Details</Link>
          </Button>
        </div>
      </div>
      <h3 className="mt-2 truncate text-sm font-medium">{game.name}</h3>
    </div>
  );
}
