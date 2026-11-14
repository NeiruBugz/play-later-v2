import { prisma } from "@/shared/lib/db.server";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";

/**
 * Record the Steam app id on catalogue games that do not carry one yet. A game
 * that already has a `steamAppId` is left untouched, and when a game appears
 * more than once the first pair wins.
 */
export async function setGameSteamAppIds(
  pairs: { gameId: string; steamAppId: number }[]
): Promise<void> {
  const seen = new Set<string>();
  const unique = pairs.filter(({ gameId }) => {
    if (seen.has(gameId)) return false;
    seen.add(gameId);
    return true;
  });
  if (unique.length === 0) return;

  const values = unique.map(
    (p) => Prisma.sql`(${p.gameId}::text, ${p.steamAppId}::int)`
  );

  await prisma.$executeRaw`
    UPDATE "Game" g
    SET "steamAppId" = v."steamAppId", "updatedAt" = now()
    FROM (VALUES ${Prisma.join(values)}) AS v("id", "steamAppId")
    WHERE g."id" = v."id" AND g."steamAppId" IS NULL
  `;
}
