import { GameDetailService } from "@/data-access-layer/services/game-detail/game-detail-service";
import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";
import {
  getPlatformsForGame,
  savePlatforms,
} from "@/data-access-layer/services/platform/platform-service";
import type { Platform } from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

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
    const dbResult = await getPlatformsForGame(igdbId);

    if (dbResult.success) {
      const { supportedPlatforms, otherPlatforms } = dbResult.data;

      if (supportedPlatforms.length > 0 || otherPlatforms.length > 0) {
        logger.info(
          {
            igdbId,
            supportedCount: supportedPlatforms.length,
            otherCount: otherPlatforms.length,
          },
          "Platforms found in database"
        );
        return {
          success: true,
          data: { supportedPlatforms, otherPlatforms },
        };
      }
    }

    logger.info(
      { igdbId },
      "No platforms found in database, fetching from IGDB"
    );

    const igdbService = new IgdbService();
    const igdbResult = await igdbService.getGameDetails({ gameId: igdbId });

    if (igdbResult.success && igdbResult.data.game) {
      const igdbGame = igdbResult.data.game;

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

        const refreshedResult = await getPlatformsForGame(igdbId);
        if (refreshedResult.success) {
          logger.info(
            {
              igdbId,
              supportedCount: refreshedResult.data.supportedPlatforms.length,
              otherCount: refreshedResult.data.otherPlatforms.length,
            },
            "Platforms populated from IGDB"
          );
          return {
            success: true,
            data: refreshedResult.data,
          };
        }
      }
    }

    logger.info(
      { igdbId },
      "Game has no platforms in IGDB, fetching all platforms as fallback"
    );

    const allPlatformsResult = await igdbService.getPlatforms();
    if (
      allPlatformsResult.success &&
      allPlatformsResult.data.platforms.length > 0
    ) {
      const mappedPlatforms = allPlatformsResult.data.platforms.map((p) => ({
        id: p.id,
        name: p.name,
        slug: `platform-${p.id}`,
      }));

      await savePlatforms(mappedPlatforms);

      const refreshedResult = await getPlatformsForGame(igdbId);
      if (refreshedResult.success) {
        logger.info(
          {
            igdbId,
            otherCount: refreshedResult.data.otherPlatforms.length,
          },
          "All IGDB platforms populated as fallback"
        );
        return {
          success: true,
          data: refreshedResult.data,
        };
      }
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
