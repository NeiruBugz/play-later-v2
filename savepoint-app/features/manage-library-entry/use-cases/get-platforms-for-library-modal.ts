"use server";

import type { PlatformDomain } from "@/data-access-layer/domain/platform";
import { upsertPlatforms } from "@/data-access-layer/repository";
import { populateGameInDatabase } from "@/data-access-layer/services/game-detail/game-detail-service";
import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";
import { PlatformService } from "@/data-access-layer/services/platform/platform-service";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVICE]: "getPlatformsForLibraryModalUseCase",
});

export type GetPlatformsForLibraryModalInput = {
  igdbId: number;
};

export type GetPlatformsForLibraryModalResult =
  | {
      success: true;
      data: {
        supportedPlatforms: PlatformDomain[];
        otherPlatforms: PlatformDomain[];
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
    const platformService = new PlatformService();

    // 1. Try database first (fast path)
    const dbResult = await platformService.getPlatformsForGame(igdbId);

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

    // 2. No platforms in DB - fetch game from IGDB to populate
    logger.info(
      { igdbId },
      "No platforms found in database, fetching from IGDB"
    );

    const igdbService = new IgdbService();
    const igdbResult = await igdbService.getGameDetails({ gameId: igdbId });

    if (igdbResult.success && igdbResult.data.game) {
      const igdbGame = igdbResult.data.game;

      if (igdbGame.platforms && igdbGame.platforms.length > 0) {
        // Map and upsert platforms
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

        const upsertResult = await upsertPlatforms(mappedPlatforms);
        if (!upsertResult.ok) {
          logger.error(
            { error: upsertResult.error, igdbId },
            "Failed to upsert platforms from IGDB"
          );
        }

        // Populate game in database (also handles platforms)
        await populateGameInDatabase(igdbGame);

        // Re-fetch platforms from database
        const refreshedResult =
          await platformService.getPlatformsForGame(igdbId);
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

    // 3. Fallback: game has no platforms in IGDB - fetch ALL platforms
    logger.info(
      { igdbId },
      "Game has no platforms in IGDB, fetching all platforms as fallback"
    );

    const allPlatformsResult = await igdbService.getPlatforms();
    if (allPlatformsResult.success && allPlatformsResult.data.platforms.length > 0) {
      const mappedPlatforms = allPlatformsResult.data.platforms.map((p) => ({
        id: p.id,
        name: p.name,
        slug: `platform-${p.id}`,
      }));

      const upsertResult = await upsertPlatforms(mappedPlatforms);
      if (!upsertResult.ok) {
        logger.error(
          { error: upsertResult.error },
          "Failed to upsert all platforms from IGDB"
        );
      } else {
        // Re-fetch from database - all platforms will be "other" since game has none
        const refreshedResult =
          await platformService.getPlatformsForGame(igdbId);
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
    }

    // Return empty arrays if we couldn't get any platforms
    logger.warn(
      { igdbId },
      "Failed to fetch platforms from any source"
    );
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
