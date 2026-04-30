import { GameDetailService } from "@/data-access-layer/services/game-detail/game-detail-service";
import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";
import {
  getPlatformsForGame,
  savePlatforms,
} from "@/data-access-layer/services/platform/platform-service";
import type { Platform } from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { NotFoundError } from "@/shared/lib/errors";

const logger = createLogger({
  [LOGGER_CONTEXT.USE_CASE]: "getPlatformsForLibraryModalUseCase",
});

export type GetPlatformsForLibraryModalInput = {
  igdbId: number;
};

export type GetPlatformsForLibraryModalResult =
  | {
      success: true;
      data: {
        supportedPlatforms: Platform[];
        otherPlatforms: Platform[];
      };
    }
  | {
      success: false;
      error: string;
    };

export async function getPlatformsForLibraryModal(
  input: GetPlatformsForLibraryModalInput
): Promise<GetPlatformsForLibraryModalResult> {
  const { igdbId } = input;
  logger.info({ igdbId }, "Use case: Fetching platforms for library modal");

  try {
    let dbResult: {
      supportedPlatforms: Platform[];
      otherPlatforms: Platform[];
    } | null = null;

    try {
      dbResult = await getPlatformsForGame(igdbId);
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error;
      }
    }

    if (
      dbResult &&
      (dbResult.supportedPlatforms.length > 0 ||
        dbResult.otherPlatforms.length > 0)
    ) {
      logger.info(
        {
          igdbId,
          supportedCount: dbResult.supportedPlatforms.length,
          otherCount: dbResult.otherPlatforms.length,
        },
        "Platforms found in database"
      );
      return {
        success: true,
        data: {
          supportedPlatforms: dbResult.supportedPlatforms,
          otherPlatforms: dbResult.otherPlatforms,
        },
      };
    }

    logger.info(
      { igdbId },
      "No platforms found in database, fetching from IGDB"
    );

    const igdbService = new IgdbService();

    try {
      const igdbResult = await igdbService.getGameDetails({ gameId: igdbId });

      if (igdbResult.game) {
        const igdbGame = igdbResult.game;

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
          }));

          await savePlatforms(mappedPlatforms);

          const gameDetailService = new GameDetailService();
          await gameDetailService.populateGameInDatabase(igdbGame);

          try {
            const refreshedResult = await getPlatformsForGame(igdbId);
            logger.info(
              {
                igdbId,
                supportedCount: refreshedResult.supportedPlatforms.length,
                otherCount: refreshedResult.otherPlatforms.length,
              },
              "Platforms populated from IGDB"
            );
            return {
              success: true,
              data: refreshedResult,
            };
          } catch {
            // Fall through to return empty arrays
          }
        }
      }
    } catch {
      // IGDB game details unavailable — fall through to platform fallback
    }

    logger.info(
      { igdbId },
      "Game has no platforms in IGDB, fetching all platforms as fallback"
    );

    try {
      const allPlatformsResult = await igdbService.getPlatforms();
      if (allPlatformsResult.platforms.length > 0) {
        const mappedPlatforms = allPlatformsResult.platforms.map((p) => ({
          id: p.id,
          name: p.name,
          slug: `platform-${p.id}`,
        }));

        await savePlatforms(mappedPlatforms);

        try {
          const refreshedResult = await getPlatformsForGame(igdbId);
          logger.info(
            {
              igdbId,
              otherCount: refreshedResult.otherPlatforms.length,
            },
            "All IGDB platforms populated as fallback"
          );
          return {
            success: true,
            data: refreshedResult,
          };
        } catch {
          // Fall through to return empty arrays
        }
      }
    } catch {
      // IGDB platforms unavailable — fall through to empty result
    }

    logger.warn({ igdbId }, "Failed to fetch platforms from any source");
    return {
      success: true,
      data: { supportedPlatforms: [], otherPlatforms: [] },
    };
  } catch (error) {
    logger.error(
      { error, igdbId },
      "Use case failed: Get platforms for library modal"
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
