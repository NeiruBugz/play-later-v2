import { IMAGE_API, IMAGE_SIZES } from "@/shared/config/image.config";
import { getGameTypeLabel } from "@/shared/lib/game/get-game-type-label";
import { SearchResponse } from "@/shared/types";

export const prepareGameCardResult = (game: SearchResponse) => {
  const coverUrl = game.cover?.image_id
    ? `${IMAGE_API}/${IMAGE_SIZES["c-sm"]}/${game.cover.image_id}.jpg`
    : null;

  const releaseDate = game.first_release_date
    ? new Date(game.first_release_date * 1000).toLocaleDateString()
    : null;

  const gameTypeLabel = getGameTypeLabel(game.game_type);

  const hasMorePlatforms = (game.platforms?.length ?? 0) > 5;

  const platforms = game.platforms
    ?.slice(0, 5)
    .map((p) => p.name)
    .join(", ");

  return {
    id: game.id,
    title: game.name,
    coverUrl,
    releaseDate,
    gameTypeLabel,
    hasMorePlatforms,
    platforms,
  };
};
