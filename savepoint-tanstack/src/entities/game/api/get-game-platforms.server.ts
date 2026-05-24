import { prisma } from "@/shared/lib/db.server";

/**
 * The IGDB platform NAMES stored for a game, via its `GamePlatform` join rows.
 *
 * Returns a sorted, de-duplicated string array; blank names are dropped.
 * Returns `[]` when the game has no stored platform data. Used to seed the
 * library modal's Platform dropdown with the platforms this game actually
 * ships on, in addition to the user's own logged platforms.
 */
export async function getGamePlatforms(gameId: string): Promise<string[]> {
  const rows = await prisma.gamePlatform.findMany({
    where: { gameId },
    select: { platform: { select: { name: true } } },
  });

  const names = rows
    .map((row) => row.platform.name)
    .filter(
      (name): name is string =>
        typeof name === "string" && name.trim().length > 0
    );

  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}
