import "server-only";

import type { Platform as PrismaPlatform } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";
import { UniquePlatformResult } from "@/shared/types/platform";

type IgdbPlatform = {
  id: number;
  name?: string;
  slug?: string;
  abbreviation?: string;
  alternative_name?: string;
  generation?: number;
  platform_family?: number;
  platform_logo?: number;
  platform_type?: number;
  checksum?: string;
};

export async function upsertPlatform(
  igdbPlatform: IgdbPlatform
): Promise<PrismaPlatform> {
  return prisma.platform.upsert({
    where: { igdbId: igdbPlatform.id },
    update: {
      name: igdbPlatform.name ?? "Unknown Platform",
      slug: igdbPlatform.slug ?? `platform-${igdbPlatform.id}`,
      abbreviation: igdbPlatform.abbreviation ?? null,
      alternativeName: igdbPlatform.alternative_name ?? null,
      generation: igdbPlatform.generation ?? null,
      platformFamily: igdbPlatform.platform_family ?? null,
      platformType: igdbPlatform.platform_type ?? null,
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
      platformType: igdbPlatform.platform_type ?? null,
      checksum: igdbPlatform.checksum ?? null,
    },
  });
}

export async function upsertPlatforms(
  igdbPlatforms: IgdbPlatform[]
): Promise<PrismaPlatform[]> {
  return prisma.$transaction(
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
          platformType: p.platform_type ?? null,
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
          platformType: p.platform_type ?? null,
          checksum: p.checksum ?? null,
        },
      })
    )
  );
}

export async function findPlatformByIgdbId(
  igdbId: number
): Promise<PrismaPlatform | null> {
  return prisma.platform.findUnique({
    where: { igdbId },
  });
}

export async function findPlatformsForGame(gameId: string): Promise<{
  supportedPlatforms: PrismaPlatform[];
  otherPlatforms: PrismaPlatform[];
}> {
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
  return {
    supportedPlatforms: allPlatforms.filter((platform) =>
      supportedPlatformIds.has(platform.id)
    ),
    otherPlatforms: allPlatforms.filter(
      (platform) => !supportedPlatformIds.has(platform.id)
    ),
  };
}

export async function findSystemPlatforms(): Promise<UniquePlatformResult[]> {
  return prisma.$queryRaw<UniquePlatformResult[]>`
    SELECT p.id, p.name, p.slug
    FROM "Platform" p
    LEFT JOIN "GamePlatform" gp ON p.id = gp."platformId"
    GROUP BY p.id, p.name, p.slug
    ORDER BY COUNT(gp."gameId") DESC, p.name ASC
  `;
}
