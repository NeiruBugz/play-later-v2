import "server-only";

import {
  findGameByIgdbId,
  findPlatformsForGame,
  findSystemPlatforms,
  isRepositorySuccess,
} from "@/data-access-layer/repository";
import type { Platform } from "@prisma/client";

import { UniquePlatformResult } from "@/shared/types/platform";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";

export class PlatformService extends BaseService {
  async getSystemPlatforms(): Promise<
    ServiceResult<{
      platforms: UniquePlatformResult[];
    }>
  > {
    try {
      const platforms = await findSystemPlatforms();
      if (!isRepositorySuccess(platforms) || !platforms.ok) {
        return this.error(
          platforms.error.message,
          ServiceErrorCode.INTERNAL_ERROR
        );
      }
      return this.success({ platforms: platforms.data });
    } catch (error) {
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  async getPlatformsForGame(igdbId: number): Promise<
    ServiceResult<{
      supportedPlatforms: Platform[];
      otherPlatforms: Platform[];
    }>
  > {
    try {
      const gameResult = await findGameByIgdbId(igdbId);
      if (!gameResult.ok) {
        return this.error("Failed to fetch game");
      }
      if (!gameResult.data) {
        return this.error("Game not found");
      }
      const result = await findPlatformsForGame(gameResult.data.id);
      if (!result.ok) {
        return this.error("Failed to fetch platforms");
      }
      return this.success(result.data);
    } catch (error) {
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
}
