import "server-only";

import {
  createGameWithRelations,
  gameExistsByIgdbId,
  upsertGenres,
  upsertPlatforms,
} from "@/data-access-layer/repository";

import { createLogger } from "@/shared/lib/app/logger";
import { LOGGER_CONTEXT } from "@/shared/lib/app/logger-context";
import type { FullGameInfoResponse } from "@/shared/types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "GameDetailService" });

/**
 * Background job: Populate game in database with genres and platforms
 * This is a fire-and-forget operation - errors are logged but not thrown
 */
export async function populateGameInDatabase(
  igdbGame: FullGameInfoResponse
): Promise<void> {
  try {
    logger.debug(
      { igdbId: igdbGame.id, slug: igdbGame.slug },
      "Starting background game population"
    );

    // Check if already exists
    const existsResult = await gameExistsByIgdbId(igdbGame.id);
    if (existsResult.ok && existsResult.data) {
      logger.debug(
        { igdbId: igdbGame.id },
        "Game already in database, skipping"
      );
      return;
    }

    // 1. Upsert genres (if any)
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

    // 2. Upsert platforms (if any)
    let platformIds: string[] = [];
    if (igdbGame.platforms && igdbGame.platforms.length > 0) {
      // Map IGDB Platform type to the format expected by repository
      const mappedPlatforms = igdbGame.platforms.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        abbreviation: p.abbreviation,
        alternative_name: p.alternative_name,
        generation: p.generation,
        platform_family:
          typeof p.platform_family === "number" ? p.platform_family : undefined,
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

    // 3. Create game with relations
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
  } catch (error) {
    // Log error but don't throw (fire-and-forget pattern)
    logger.error(
      { error, igdbId: igdbGame.id, slug: igdbGame.slug },
      "Failed to populate game in database (background job)"
    );
  }
}
