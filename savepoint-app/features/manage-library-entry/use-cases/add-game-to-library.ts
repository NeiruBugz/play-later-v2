"use server";

import { GameDetailService } from "@/data-access-layer/services/game-detail/game-detail-service";
import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";
import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";

import type { LibraryItemDomain } from "@/features/library/types";
import { resolvePrimaryPlatform } from "@/features/manage-library-entry/lib/resolve-primary-platform";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { AcquisitionType, type LibraryItemStatus } from "@/shared/types";

const logger = createLogger({
  [LOGGER_CONTEXT.USE_CASE]: "addGameToLibraryUseCase",
});
export type AddGameToLibraryInput = {
  userId: string;
  igdbId: number;
  status: LibraryItemStatus;
  platform?: string;
  startedAt?: Date;
  completedAt?: Date;
  acquisitionType?: AcquisitionType;
  autoDetectPlatform?: boolean;
};
export type AddGameToLibraryResult =
  | {
      success: true;
      data: {
        libraryItem: LibraryItemDomain;
        gameSlug: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function addGameToLibrary(
  input: AddGameToLibraryInput
): Promise<AddGameToLibraryResult> {
  try {
    const {
      userId,
      igdbId,
      status,
      platform: explicitPlatform,
      startedAt,
      completedAt,
      acquisitionType,
      autoDetectPlatform,
    } = input;
    logger.info({ userId, igdbId, status }, "Use case: Adding game to library");
    const profileService = new ProfileService();
    await profileService.verifyUserExists({ userId });
    const libraryService = new LibraryService();
    let game = await libraryService.findGameByIgdbId(igdbId);
    let fetchedIgdbPlatforms: Array<{ id: number; name?: string }> | undefined;
    if (!game) {
      logger.info(
        { igdbId },
        "Game not in database, fetching from IGDB and populating"
      );
      const igdbService = new IgdbService();
      const igdbGameResult = await igdbService.getGameDetails({
        gameId: igdbId,
      });
      if (!igdbGameResult.success) {
        logger.error(
          { igdbId, error: igdbGameResult.error },
          "Failed to fetch game from IGDB"
        );
        return {
          success: false,
          error: "Failed to fetch game details from IGDB",
        };
      }
      if (!igdbGameResult.data.game) {
        logger.error({ igdbId }, "Game not found in IGDB");
        return {
          success: false,
          error: "Game not found in IGDB",
        };
      }
      fetchedIgdbPlatforms = (
        igdbGameResult.data.game as {
          platforms?: Array<{ id: number; name?: string }>;
        }
      ).platforms;
      const gameDetailService = new GameDetailService();
      await gameDetailService.populateGameInDatabase(igdbGameResult.data.game);
      game = await libraryService.findGameByIgdbId(igdbId);
      if (!game) {
        logger.error({ igdbId }, "Game still not found after population");
        return {
          success: false,
          error: "Failed to save game to database",
        };
      }
    }

    let resolvedPlatform: string | undefined = explicitPlatform;
    if (autoDetectPlatform === true && explicitPlatform === undefined) {
      let igdbPlatforms = fetchedIgdbPlatforms;

      if (!igdbPlatforms) {
        const igdbService = new IgdbService();
        const igdbGameResult = await igdbService.getGameDetails({
          gameId: igdbId,
        });
        if (igdbGameResult.success && igdbGameResult.data.game) {
          igdbPlatforms = (
            igdbGameResult.data.game as {
              platforms?: Array<{ id: number; name?: string }>;
            }
          ).platforms;
        }
      }

      const knownPlatforms = await libraryService.listPlatforms();
      const detected = resolvePrimaryPlatform({
        igdbPlatforms: igdbPlatforms ?? [],
        knownPlatforms,
      });
      resolvedPlatform = detected ?? undefined;
      logger.info(
        {
          userId,
          igdbId,
          resolvedPlatform: detected,
          autoDetect: true,
        },
        "Auto-detected primary platform"
      );
    }

    const existingItems = await libraryService.findAllLibraryItemsByGameId({
      userId,
      gameId: game.id,
    });
    const exactDuplicate = existingItems.find(
      (item) =>
        item.status === status &&
        (item.platform === resolvedPlatform ||
          (item.platform === null && resolvedPlatform === undefined))
    );
    if (exactDuplicate) {
      if (autoDetectPlatform === true) {
        logger.info(
          { userId, gameId: game.id, status },
          "Quick add: returning existing library item (idempotent)"
        );
        return {
          success: true,
          data: {
            libraryItem: exactDuplicate,
            gameSlug: game.slug,
          },
        };
      }
      logger.warn(
        {
          userId,
          gameId: game.id,
          status,
          platform: resolvedPlatform,
        },
        "Attempted to add duplicate game to library"
      );
      return {
        success: false,
        error: "This game is already in your library",
      };
    }
    const libraryItem = await libraryService.createLibraryItem({
      userId,
      gameId: game.id,
      libraryItem: {
        status,
        acquisitionType: acquisitionType ?? AcquisitionType.DIGITAL,
        platform: resolvedPlatform ?? undefined,
        startedAt: startedAt ?? undefined,
        completedAt: completedAt ?? undefined,
      },
    });
    logger.info(
      {
        userId,
        gameId: game.id,
        libraryItemId: libraryItem.id,
        status,
      },
      "Game added to library successfully"
    );
    return {
      success: true,
      data: {
        libraryItem,
        gameSlug: game.slug,
      },
    };
  } catch (error) {
    logger.error({ error, input }, "Use case failed: Add game to library");
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
