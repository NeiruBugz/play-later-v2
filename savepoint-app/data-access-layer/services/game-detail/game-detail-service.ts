import "server-only";

import {
  createGameWithRelations,
  gameExistsByIgdbId,
  upsertGenres,
  upsertPlatforms,
} from "@/data-access-layer/repository";
import type { Game } from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import type { FullGameInfoResponse } from "@/shared/types";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";

export class GameDetailService extends BaseService {
  private logger = createLogger({
    [LOGGER_CONTEXT.SERVICE]: "GameDetailService",
  });

  async populateGameInDatabase(
    igdbGame: FullGameInfoResponse
  ): Promise<ServiceResult<Game | null>> {
    try {
      this.logger.debug(
        { igdbId: igdbGame.id, slug: igdbGame.slug },
        "Starting background game population"
      );

      const existsResult = await gameExistsByIgdbId(igdbGame.id);
      if (existsResult.success && existsResult.data) {
        this.logger.debug(
          { igdbId: igdbGame.id },
          "Game already in database, skipping"
        );
        return this.success(null);
      }

      let genreIds: string[] = [];
      if (igdbGame.genres && igdbGame.genres.length > 0) {
        const genresResult = await upsertGenres(igdbGame.genres);
        if (!genresResult.success) {
          this.logger.error(
            { error: genresResult.error },
            "Failed to upsert genres"
          );
          return this.error(
            `Failed to upsert genres: ${genresResult.error.message}`,
            ServiceErrorCode.INTERNAL_ERROR
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
            typeof p.platform_family === "number"
              ? p.platform_family
              : undefined,
          platform_type:
            typeof p.platform_type === "number" ? p.platform_type : undefined,
          checksum: p.checksum,
        }));
        const platformsResult = await upsertPlatforms(mappedPlatforms);
        if (!platformsResult.success) {
          this.logger.error(
            { error: platformsResult.error },
            "Failed to upsert platforms"
          );
          return this.error(
            `Failed to upsert platforms: ${platformsResult.error.message}`,
            ServiceErrorCode.INTERNAL_ERROR
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

      if (!gameResult.success) {
        this.logger.error({ error: gameResult.error }, "Failed to create game");
        return this.error(
          `Failed to create game: ${gameResult.error.message}`,
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      this.logger.info(
        {
          igdbId: igdbGame.id,
          gameId: gameResult.data.id,
          slug: igdbGame.slug,
        },
        "Game populated in database successfully"
      );
      return this.success(gameResult.data);
    } catch (error) {
      this.logger.warn(
        { error, igdbId: igdbGame.id, slug: igdbGame.slug },
        "Background game population failed - will retry on next access"
      );
      return this.error(
        error instanceof Error ? error.message : "Unknown error",
        ServiceErrorCode.INTERNAL_ERROR
      );
    }
  }
}
