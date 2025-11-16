import "server-only";

import {
  findGameByIgdbId,
  findPlatformsForGame,
} from "@/data-access-layer/repository";
import type { Platform } from "@prisma/client";

import { BaseService, type ServiceResult } from "../types";

export class PlatformService extends BaseService {
  /**
   * Get platforms for a game, grouped into supported and other platforms
   *
   * @param igdbId - The IGDB ID of the game to get platforms for
   * @returns Service result with supported and other platforms
   */
  async getPlatformsForGame(igdbId: number): Promise<
    ServiceResult<{
      supportedPlatforms: Platform[];
      otherPlatforms: Platform[];
    }>
  > {
    try {
      // Find game by IGDB ID to get internal database ID
      const gameResult = await findGameByIgdbId(igdbId);

      if (!gameResult.ok) {
        return this.error("Failed to fetch game");
      }

      if (!gameResult.data) {
        return this.error("Game not found");
      }

      // Fetch platforms using internal game ID
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
