import { prisma } from "@/shared/lib/db.server";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";

/**
 * Record a lookup outcome per row in one UPDATE: a found row gets its `gameId`,
 * an unfound row (`gameId: null`) keeps whatever link it had. Every row is
 * stamped `lookedUpAt = now()`, which is what separates "needs a match" from
 * "not looked up yet".
 */
export async function applyLookupResults(
  rows: { id: string; gameId: string | null }[]
): Promise<void> {
  if (rows.length === 0) return;

  const values = rows.map(
    (row) => Prisma.sql`(${row.id}::text, ${row.gameId}::text)`
  );

  await prisma.$executeRaw`
    UPDATE "ImportedGame" ig
    SET
      "gameId" = COALESCE(v."gameId", ig."gameId"),
      "lookedUpAt" = now(),
      "updatedAt" = now()
    FROM (VALUES ${Prisma.join(values)}) AS v("id", "gameId")
    WHERE ig."id" = v."id"
  `;
}
