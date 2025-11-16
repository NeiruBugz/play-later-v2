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
 * Uses a transaction to batch all upsert operations for better performance
 * Reduces database round trips from N queries to 1 transaction
 */
export async function upsertPlatforms(
  igdbPlatforms: IgdbPlatform[]
): Promise<RepositoryResult<PrismaPlatform[]>> {
  try {
    // Use $transaction to batch all upserts into a single operation
    // This is more efficient than Promise.all with individual queries
    const platforms = await prisma.$transaction(
      igdbPlatforms.map((p) =>
        prisma.platform.upsert({
          where: { igdbId: p.id },
          update: {
            name: p.name ?? "Unknown Platform",
            slug: p.slug ?? `platform-${p.id}`,
            abbreviation: p.abbreviation ?? null,
            alternativeName: p.alternative_name ?? null,
            generation: p.generation ?? null,
            platformFamily: p.platform_family ?? null,
            platformType: p.platform_logo ?? null,
            checksum: p.checksum ?? null,
          },
          create: {
            igdbId: p.id,
            name: p.name ?? "Unknown Platform",
            slug: p.slug ?? `platform-${p.id}`,
            abbreviation: p.abbreviation ?? null,
            alternativeName: p.alternative_name ?? null,
            generation: p.generation ?? null,
            platformFamily: p.platform_family ?? null,
            platformType: p.platform_logo ?? null,
            checksum: p.checksum ?? null,
          },
        })
      )
    );

    return repositorySuccess(platforms);
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

/**
 * Find platforms for a specific game
 * Returns platforms grouped into supported (linked via GamePlatform) and other platforms
 */
export async function findPlatformsForGame(gameId: string): Promise<
  RepositoryResult<{
    supportedPlatforms: PrismaPlatform[];
    otherPlatforms: PrismaPlatform[];
  }>
> {
  try {
    const [gamePlatforms, allPlatforms] = await Promise.all([
      prisma.gamePlatform.findMany({
        where: { gameId },
        select: { platformId: true },
      }),
      prisma.platform.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    const supportedPlatformIds = new Set(
      gamePlatforms.map((gp) => gp.platformId)
    );

    const supportedPlatforms = allPlatforms.filter((platform) =>
      supportedPlatformIds.has(platform.id)
    );

    const otherPlatforms = allPlatforms.filter(
      (platform) => !supportedPlatformIds.has(platform.id)
    );

    return repositorySuccess({
      supportedPlatforms,
      otherPlatforms,
    });
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find platforms for game: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
