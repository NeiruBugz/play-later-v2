"use client";

import Link from "next/link";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { getStatusConfig } from "@/shared/lib/library-status";

import type { GameCardProps } from "./game-card.types";
import { QuickAddButton } from "./quick-add-button";

export const GameGridCard = ({ game }: GameCardProps) => {
  const hasLibraryStatus =
    "libraryStatus" in game && game.libraryStatus != null;

  const statusConfig = hasLibraryStatus
    ? getStatusConfig(game.libraryStatus!)
    : null;

  return (
    <Link
      href={`/games/${game.slug}`}
      className="focus-visible:ring-primary group block rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={`View ${game.name}`}
    >
      <Card
        variant="interactive"
        className="duration-normal ease-out-expo hover:shadow-paper-md overflow-hidden rounded-lg transition-all hover:scale-[1.02]"
      >
        <div className="relative">
          <GameCoverImage
            imageId={game.cover?.image_id}
            gameTitle={game.name}
            size="hd"
            className="aspect-[3/4] w-full"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {hasLibraryStatus && statusConfig && (
            <div className="absolute top-2 left-2 z-10">
              <Badge
                variant={statusConfig.badgeVariant}
                className="shadow-paper-sm backdrop-blur-sm"
              >
                {statusConfig.label}
              </Badge>
            </div>
          )}

          {!hasLibraryStatus && (
            <div className="duration-normal pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="pointer-events-auto">
                <QuickAddButton igdbId={game.id} gameTitle={game.name} />
              </div>
            </div>
          )}

          <div className="p-md absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <h3 className="body-sm line-clamp-2 font-semibold text-white drop-shadow-md">
              {game.name}
            </h3>
            {game.first_release_date && (
              <p className="caption text-muted mt-1 text-white/70">
                {new Date(game.first_release_date * 1000).getFullYear()}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};
