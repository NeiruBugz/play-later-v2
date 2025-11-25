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
      supportedPlatforms: PlatformDomain[];
      otherPlatforms: PlatformDomain[];
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
      const supportedPlatforms = PlatformMapper.toDomainList(
        result.data.supportedPlatforms
      );
      const otherPlatforms = PlatformMapper.toDomainList(
        result.data.otherPlatforms
      );
      return this.success({ supportedPlatforms, otherPlatforms });
    } catch (error) {
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
}
