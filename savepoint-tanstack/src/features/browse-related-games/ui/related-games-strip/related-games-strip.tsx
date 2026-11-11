import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { GameCover } from "@/shared/ui/game-cover";
import { SectionLabel } from "@/shared/ui/section-label";

import { RELATED_GAMES_PREVIEW_SIZE } from "../related-games-list/related-games-list.utility";
import type { RelatedGamesStripProps } from "./related-games-strip.type";

const HEADING_ID = "related-games-heading";

export function RelatedGamesStrip({ sections }: RelatedGamesStripProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const series = sections[0];
  if (series === undefined || series.games.length === 0) return null;

  const canExpand = series.games.length > RELATED_GAMES_PREVIEW_SIZE;
  const visibleGames =
    isExpanded || !canExpand
      ? series.games
      : series.games.slice(0, RELATED_GAMES_PREVIEW_SIZE);

  return (
    <section
      aria-labelledby={HEADING_ID}
      className="flex min-w-0 flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-2">
        <SectionLabel id={HEADING_ID}>
          {`More in ${series.collectionName}`}
        </SectionLabel>
        {canExpand ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? "Show fewer" : `All ${series.games.length}`}
          </Button>
        ) : null}
      </div>
      <ul className="flex snap-x gap-3 overflow-x-auto pb-2">
        {visibleGames.map((game) => (
          <li key={game.igdbId} className="w-28 shrink-0 snap-start sm:w-32">
            <Link
              to="/games/$slug"
              params={{ slug: game.slug }}
              className="flex flex-col gap-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <GameCover src={game.coverImageId} name={game.title} />
              <span className="line-clamp-2 text-xs leading-snug">
                {game.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
