import "server-only";

import {
  createGameWithRelations,
  findGameById,
  findGameByIgdbId,
  findGamesByIds,
  gameExistsByIgdbId,
  upsertGenres,
  upsertPlatforms,
  type GameBasicInfo,
} from "@/data-access-layer/repository";
import type { Game } from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { ConflictError } from "@/shared/lib/errors";
import type { FullGameInfoResponse } from "@/shared/types";

export async function getGameByIgdbId(
  igdbId: number
): Promise<Awaited<ReturnType<typeof findGameByIgdbId>>> {
  return findGameByIgdbId(igdbId);
}

export async function getGamesByIds(
  gameIds: string[]
): Promise<GameBasicInfo[]> {
  return findGamesByIds(gameIds);
}

export async function getGameById(
  gameId: string
): Promise<GameBasicInfo | null> {
  return findGameById(gameId);
}

export class GameDetailService {
  private logger = createLogger({
    [LOGGER_CONTEXT.SERVICE]: "GameDetailService",
  });

  async populateGameInDatabase(
    igdbGame: FullGameInfoResponse
  ): Promise<Game | null> {
    this.logger.debug(
      { igdbId: igdbGame.id, slug: igdbGame.slug },
      "Starting background game population"
    );

    const exists = await gameExistsByIgdbId(igdbGame.id);
    if (exists) {
      this.logger.debug(
        { igdbId: igdbGame.id },
        "Game already in database, skipping"
      );
      return null;
    }

    let genreIds: string[] = [];
    if (igdbGame.genres && igdbGame.genres.length > 0) {
      const genres = await upsertGenres(igdbGame.genres);
      genreIds = genres.map((g) => g.id);
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
      const platforms = await upsertPlatforms(mappedPlatforms);
      platformIds = platforms.map((p) => p.id);
    }

    try {
      const game = await createGameWithRelations({
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

      return game;
    } catch (error) {
      if (error instanceof ConflictError) {
        this.logger.debug(
          { igdbId: igdbGame.id, slug: igdbGame.slug },
          "Game already populated by concurrent request, skipping"
        );
        return null;
      }

      this.logger.warn(
        { error, igdbId: igdbGame.id, slug: igdbGame.slug },
        "Background game population failed - will retry on next access"
      );
      throw error;
    }
  }
}
