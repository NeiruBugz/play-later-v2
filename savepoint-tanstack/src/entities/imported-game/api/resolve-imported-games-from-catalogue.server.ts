import { prisma } from "@/shared/lib/db.server";

import type { Storefront } from "../model/types";

const POSTGRES_INT_MAX = 2_147_483_647;

/**
 * Link the user's not-yet-linked rows to catalogue games that already carry the
 * row's Steam app id, with no IGDB call. Returns how many rows were resolved.
 *
 * Only rows that still await a match are touched: live, not dismissed, not
 * already added, `gameId` null. When several catalogue games share an app id the
 * earliest created one wins (`DISTINCT ON`). Non-numeric storefront ids are
 * dropped before the app ids are bound as an `int[]` (keeping the
 * `Game.steamAppId` index usable) and the join compares text, so no row is ever
 * cast to a number inside SQL.
 */
export async function resolveImportedGamesFromCatalogue(
  userId: string,
  storefront: Storefront
): Promise<number> {
  const awaitingMatch = await prisma.importedGame.findMany({
    where: {
      userId,
      storefront,
      deletedAt: null,
      gameId: null,
      igdbMatchStatus: { in: ["PENDING", "UNMATCHED"] },
    },
    select: { storefrontGameId: true },
  });
  const steamAppIds = awaitingMatch
    .map((row) => row.storefrontGameId)
    .filter((id): id is string => id !== null && /^\d{1,10}$/.test(id))
    .map(Number)
    .filter((id) => id <= POSTGRES_INT_MAX);
  if (steamAppIds.length === 0) return 0;

  return prisma.$executeRaw`
    UPDATE "ImportedGame" ig
    SET "gameId" = g."id", "lookedUpAt" = now(), "updatedAt" = now()
    FROM (
      SELECT DISTINCT ON ("steamAppId") "id", "steamAppId"
      FROM "Game"
      WHERE "steamAppId" = ANY(${steamAppIds}::int[])
      ORDER BY "steamAppId", "createdAt"
    ) g
    WHERE ig."userId" = ${userId}
      AND ig."storefront" = ${storefront}::"Storefront"
      AND ig."deletedAt" IS NULL
      AND ig."gameId" IS NULL
      AND ig."igdbMatchStatus" IN ('PENDING', 'UNMATCHED')
      AND ig."storefrontGameId" = g."steamAppId"::text
  `;
}
