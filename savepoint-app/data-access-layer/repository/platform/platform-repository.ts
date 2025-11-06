import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import type { Platform as PrismaPlatform } from "@prisma/client";

import { prisma } from "@/shared/lib";

/**
 * IGDB Platform type from their API
 */
type IgdbPlatform = {
  id: number;
  name?: string;
  slug?: string;
  abbreviation?: string;
  alternative_name?: string;
  generation?: number;
  platform_family?: number;
  platform_logo?: number;
  checksum?: string;
};

/**
 * Upserts a single platform from IGDB data
 * Creates a new platform if it doesn't exist, updates it if it does
 */
export async function upsertPlatform(
  igdbPlatform: IgdbPlatform
): Promise<RepositoryResult<PrismaPlatform>> {
  try {
    const platform = await prisma.platform.upsert({
      where: { igdbId: igdbPlatform.id },
      update: {
        name: igdbPlatform.name ?? "Unknown Platform",
        slug: igdbPlatform.slug ?? `platform-${igdbPlatform.id}`,
        abbreviation: igdbPlatform.abbreviation ?? null,
        alternativeName: igdbPlatform.alternative_name ?? null,
        generation: igdbPlatform.generation ?? null,
        platformFamily: igdbPlatform.platform_family ?? null,
        platformType: igdbPlatform.platform_logo ?? null,
        checksum: igdbPlatform.checksum ?? null,
      },
      create: {
        igdbId: igdbPlatform.id,
        name: igdbPlatform.name ?? "Unknown Platform",
        slug: igdbPlatform.slug ?? `platform-${igdbPlatform.id}`,
        abbreviation: igdbPlatform.abbreviation ?? null,
        alternativeName: igdbPlatform.alternative_name ?? null,
        generation: igdbPlatform.generation ?? null,
        platformFamily: igdbPlatform.platform_family ?? null,
        platformType: igdbPlatform.platform_logo ?? null,
        checksum: igdbPlatform.checksum ?? null,
      },
    });

    return repositorySuccess(platform);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to upsert platform: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Upserts multiple platforms from IGDB data
 * Processes each platform individually and returns all successfully upserted platforms
 */
export async function upsertPlatforms(
  igdbPlatforms: IgdbPlatform[]
): Promise<RepositoryResult<PrismaPlatform[]>> {
  try {
    const results = await Promise.all(
      igdbPlatforms.map((p) => upsertPlatform(p))
    );

    const successfulPlatforms = results
      .filter((r) => r.ok)
      .map((r) => r.data as PrismaPlatform);

    return repositorySuccess(successfulPlatforms);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to upsert platforms: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Finds a platform by its IGDB ID
 * Returns null if not found
 */
export async function findPlatformByIgdbId(
  igdbId: number
): Promise<RepositoryResult<PrismaPlatform | null>> {
  try {
    const platform = await prisma.platform.findUnique({
      where: { igdbId },
    });

    return repositorySuccess(platform);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find platform: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
