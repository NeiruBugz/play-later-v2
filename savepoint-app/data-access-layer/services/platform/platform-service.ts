import "server-only";

import {
  findGameByIgdbId,
  findPlatformsForGame,
  findSystemPlatforms,
  upsertPlatforms,
} from "@/data-access-layer/repository";
import type { Platform } from "@prisma/client";

import { NotFoundError } from "@/shared/lib/errors";
import { UniquePlatformResult } from "@/shared/types/platform";

type UpsertPlatformInput = {
  id: number;
  name?: string;
  slug?: string;
  abbreviation?: string;
  alternative_name?: string;
  generation?: number;
  platform_family?: number;
  platform_type?: number;
  checksum?: string;
};

export async function getSystemPlatforms(): Promise<{
  platforms: UniquePlatformResult[];
}> {
  const platforms = await findSystemPlatforms();
  return { platforms };
}

export async function savePlatforms(
  platforms: UpsertPlatformInput[]
): Promise<Platform[]> {
  return upsertPlatforms(platforms);
}

export async function getPlatformsForGame(igdbId: number): Promise<{
  supportedPlatforms: Platform[];
  otherPlatforms: Platform[];
}> {
  const game = await findGameByIgdbId(igdbId);
  if (!game) {
    throw new NotFoundError("Game not found", { gameId: igdbId });
  }

  const platformData = await findPlatformsForGame(game.id);

  return {
    supportedPlatforms: platformData.supportedPlatforms,
    otherPlatforms: platformData.otherPlatforms,
  };
}
