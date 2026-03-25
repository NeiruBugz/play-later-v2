import "server-only";

import {
  findGameByIgdbId,
  findPlatformsForGame,
  findSystemPlatforms,
} from "@/data-access-layer/repository";
import type { Platform } from "@prisma/client";

import { UniquePlatformResult } from "@/shared/types/platform";

import {
  handleServiceError,
  serviceError,
  serviceSuccess,
  type ServiceResult,
} from "../types";

export async function getSystemPlatforms(): Promise<
  ServiceResult<{
    platforms: UniquePlatformResult[];
  }>
> {
  try {
    const platforms = await findSystemPlatforms();
    return serviceSuccess({ platforms });
  } catch (error) {
    return handleServiceError(error, "Failed to get system platforms");
  }
}

export async function getPlatformsForGame(igdbId: number): Promise<
  ServiceResult<{
    supportedPlatforms: Platform[];
    otherPlatforms: Platform[];
  }>
> {
  try {
    const game = await findGameByIgdbId(igdbId);
    if (!game) {
      return serviceError("Game not found");
    }

    const platformData = await findPlatformsForGame(game.id);

    return serviceSuccess({
      supportedPlatforms: platformData.supportedPlatforms,
      otherPlatforms: platformData.otherPlatforms,
    });
  } catch (error) {
    return handleServiceError(error, "Failed to get platforms for game");
  }
}
