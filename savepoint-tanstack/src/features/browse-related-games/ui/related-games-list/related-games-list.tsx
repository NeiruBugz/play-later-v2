import { useState } from "react";

import { Button } from "@/shared/ui/button";

import type { RelatedGamesListProps } from "./related-games-list.type";
import { RELATED_GAMES_PREVIEW_SIZE } from "./related-games-list.utility";

export function RelatedGamesList({ games, renderGame }: RelatedGamesListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const canExpand = games.length > RELATED_GAMES_PREVIEW_SIZE;
  const visibleGames =
    isExpanded || !canExpand
      ? games
      : games.slice(0, RELATED_GAMES_PREVIEW_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visibleGames.map((game) => (
          <li key={game.igdbId}>{renderGame(game)}</li>
        ))}
      </ul>

      {canExpand ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          {isExpanded ? "Show fewer" : `Show all (${games.length})`}
        </Button>
      ) : null}
    </div>
  );
}
