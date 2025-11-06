import Image from "next/image";
import Link from "next/link";

import { PlatformBadges } from "@/shared/components/platform-badges";
import { Card } from "@/shared/components/ui/card";

import type { SearchGameResult } from "../types";
import { GameCategoryBadge } from "./game-category-badge";
import { GameCoverPlaceholder } from "./game-cover-placeholder";

export const GameCard = ({ game }: { game: SearchGameResult }) => {
  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null;

  const platforms = game.platforms?.map((p) => p.name) ?? [];

  return (
    <Link href={`/games/${game.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex gap-4 p-3">
          <div className="bg-muted relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-md">
            {game.cover?.image_id ? (
              <Image
                src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`}
                alt={`${game.name} cover`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <GameCoverPlaceholder />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base leading-tight font-semibold">
                {game.name}
              </h3>
              <GameCategoryBadge category={game.game_type} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {releaseYear && (
                <span className="text-muted-foreground text-sm">
                  {releaseYear}
                </span>
              )}
            </div>

            {platforms.length > 0 && (
              <div className="mt-auto">
                <PlatformBadges platforms={platforms} />
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};
