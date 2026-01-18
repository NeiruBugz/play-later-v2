"use client";

import {
  GameCardFooter,
  GameCard as UnifiedGameCard,
} from "@/shared/components/game-card";
import { Badge } from "@/shared/components/ui/badge";
import { getStatusConfig } from "@/shared/lib/library-status";

import type { GameCardProps } from "./game-card.types";
import { GameCategoryBadge } from "./game-category-badge";
import { QuickAddButton } from "./quick-add-button";

export const GameCard = ({ game }: GameCardProps) => {
  const hasLibraryStatus =
    "libraryStatus" in game && game.libraryStatus != null;

  const libraryBadge =
    hasLibraryStatus && game.libraryStatus ? (
      <div className="absolute top-2 left-2">
        <Badge
          variant={getStatusConfig(game.libraryStatus).badgeVariant}
          className="shadow-paper-sm backdrop-blur-sm"
        >
          {getStatusConfig(game.libraryStatus).label}
        </Badge>
      </div>
    ) : undefined;

  const quickAddOverlay = !hasLibraryStatus ? (
    <div className="pointer-events-auto absolute top-1 right-1">
      <QuickAddButton igdbId={game.id} gameTitle={game.name} />
    </div>
  ) : undefined;

  return (
    <UnifiedGameCard
      game={{
        id: game.id,
        name: game.name,
        slug: game.slug,
        coverImageId: game.cover?.image_id,
        releaseDate: game.first_release_date,
        platforms: game.platforms,
        gameType: game.game_type,
      }}
      layout="horizontal"
      density="detailed"
      sizes="96px"
      badges={libraryBadge}
      overlay={quickAddOverlay}
    >
      <GameCardFooter>
        <GameCategoryBadge category={game.game_type} />
      </GameCardFooter>
    </UnifiedGameCard>
  );
};
