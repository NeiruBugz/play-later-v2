import "server-only";

import {
  PlatformMapper,
  type PlatformDomain,
} from "@/data-access-layer/domain/platform";
import {
  findGameByIgdbId,
  findPlatformsForGame,
  findSystemPlatforms,
  isRepositorySuccess,
} from "@/data-access-layer/repository";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { UniquePlatformResult } from "@/shared/types/platform";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";

export class PlatformService extends BaseService {
  private logger = createLogger({
    [LOGGER_CONTEXT.SERVICE]: "PlatformService",
  });
  async getSystemPlatforms(): Promise<
    ServiceResult<{
      platforms: UniquePlatformResult[];
    }>
  > {
    try {
      this.logger.info("Fetching system platforms");

      const platforms = await findSystemPlatforms();
      if (!isRepositorySuccess(platforms) || !platforms.success) {
        this.logger.error(
          { error: platforms.error },
          "Failed to fetch system platforms"
        );
        return this.error(
          platforms.error.message,
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      this.logger.info(
        { count: platforms.data.length },
        "System platforms fetched successfully"
      );
      return this.success({ platforms: platforms.data });
    } catch (error) {
      this.logger.error({ error }, "Unexpected error in getSystemPlatforms");
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  async getPlatformsForGame(igdbId: number): Promise<
    ServiceResult<{
      supportedPlatforms: PlatformDomain[];
      otherPlatforms: PlatformDomain[];
    }>
  > {
    try {
      this.logger.info({ igdbId }, "Fetching platforms for game");

      const gameResult = await findGameByIgdbId(igdbId);
      if (!gameResult.success) {
        this.logger.error(
          { error: gameResult.error, igdbId },
          "Failed to fetch game"
        );
        return this.error("Failed to fetch game");
      }
      if (!gameResult.data) {
        this.logger.warn({ igdbId }, "Game not found");
        return this.error("Game not found");
      }

      const result = await findPlatformsForGame(gameResult.data.id);
      if (!result.success) {
        this.logger.error(
          { error: result.error, gameId: gameResult.data.id, igdbId },
          "Failed to fetch platforms"
        );
        return this.error("Failed to fetch platforms");
      }

      const supportedPlatforms = PlatformMapper.toDomainList(
        result.data.supportedPlatforms
      );
      const otherPlatforms = PlatformMapper.toDomainList(
        result.data.otherPlatforms
      );

      this.logger.info(
        {
          igdbId,
          supportedCount: supportedPlatforms.length,
          otherCount: otherPlatforms.length,
        },
        "Platforms fetched successfully"
      );
      return this.success({ supportedPlatforms, otherPlatforms });
    } catch (error) {
      this.logger.error(
        { error, igdbId },
        "Unexpected error in getPlatformsForGame"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
}
