import "server-only";

import {
  createGameWithRelations,
  gameExistsByIgdbId,
  upsertGenres,
  upsertPlatforms,
} from "@/data-access-layer/repository";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import type { FullGameInfoResponse } from "@/shared/types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "GameDetailService" });
export async function populateGameInDatabase(
  igdbGame: FullGameInfoResponse
): Promise<{ ok: boolean; error?: string }> {
  try {
    logger.debug(
      { igdbId: igdbGame.id, slug: igdbGame.slug },
      "Starting background game population"
    );
    const existsResult = await gameExistsByIgdbId(igdbGame.id);
    if (existsResult.ok && existsResult.data) {
      logger.debug(
        { igdbId: igdbGame.id },
        "Game already in database, skipping"
      );
      return { ok: true };
    }
    let genreIds: string[] = [];
    if (igdbGame.genres && igdbGame.genres.length > 0) {
      const genresResult = await upsertGenres(igdbGame.genres);
      if (!genresResult.ok) {
        logger.error({ error: genresResult.error }, "Failed to upsert genres");
        throw new Error(
          `Failed to upsert genres: ${genresResult.error.message}`
        );
      }
      genreIds = genresResult.data.map((g) => g.id);
    }
    let platformIds: string[] = [];
    if (igdbGame.platforms && igdbGame.platforms.length > 0) {
      const mappedPlatforms = igdbGame.platforms.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        abbreviation: p.abbreviation,
        alternative_name: p.alternative_name,
        generation: p.generation,
        platform_family:
          typeof p.platform_family === "number" ? p.platform_family : undefined,
        platform_type:
          typeof p.platform_type === "number" ? p.platform_type : undefined,
        checksum: p.checksum,
      }));
      const platformsResult = await upsertPlatforms(mappedPlatforms);
      if (!platformsResult.ok) {
        logger.error(
          { error: platformsResult.error },
          "Failed to upsert platforms"
        );
        throw new Error(
          `Failed to upsert platforms: ${platformsResult.error.message}`
        );
      }
      platformIds = platformsResult.data.map((p) => p.id);
    }
    const gameResult = await createGameWithRelations({
      igdbGame: {
        id: igdbGame.id,
        name: igdbGame.name,
        slug: igdbGame.slug,
        summary: igdbGame.summary,
        cover: igdbGame.cover,
        first_release_date: igdbGame.first_release_date,
        franchise:
          typeof igdbGame.franchise === "number"
            ? { id: igdbGame.franchise }
            : igdbGame.franchise,
      },
      genreIds,
      platformIds,
    });
    if (!gameResult.ok) {
      logger.error({ error: gameResult.error }, "Failed to create game");
      throw new Error(`Failed to create game: ${gameResult.error.message}`);
    }
    logger.info(
      { igdbId: igdbGame.id, gameId: gameResult.data.id, slug: igdbGame.slug },
      "Game populated in database successfully"
    );
    return { ok: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.warn(
      { error, igdbId: igdbGame.id, slug: igdbGame.slug },
      "Background game population failed - will retry on next access"
    );
    return { ok: false, error: errorMessage };
  }
}
