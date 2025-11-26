import {
  GameCardFooter,
  GameCard as UnifiedGameCard,
} from "@/shared/components/game-card";

import type { GameCardProps } from "./game-card.types";
import { GameCategoryBadge } from "./game-category-badge";

export const GameCard = ({ game }: GameCardProps) => {
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
    >
      <GameCardFooter>
        <GameCategoryBadge category={game.game_type} />
      </GameCardFooter>
    </UnifiedGameCard>
  );
};
