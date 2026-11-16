import { prisma } from "@/shared/lib/db.server";

import type { ImportJob } from "../model/types";

/**
 * Finish a GATHERING or LOOKING_UP job whose chunks are all done
 * (`cardinality("doneChunkIndexes") = "totalChunks"`; a job with no chunks
 * qualifies at once). Returns the finished job, or `null` when chunks are
 * outstanding or the job is not active, so concurrent last-chunk workers
 * finalize exactly once.
 *
 * The same UPDATE writes the finish-time summary: `newGames` (rows created
 * from the job on, unless their game was in the library before the job) and
 * `needsMatch` (live, not-removed rows looked up without a game).
 */
export async function finalizeImportJobIfComplete(
  jobId: string
): Promise<ImportJob | null> {
  const rows = await prisma.$queryRaw<ImportJob[]>`
    UPDATE "ImportJob"
    SET
      "status" = 'FINISHED',
      "finishedAt" = now(),
      "updatedAt" = now(),
      "newGames" = (
        SELECT count(*)::int FROM "ImportedGame" ig
        WHERE ig."userId" = "ImportJob"."userId"
          AND ig."storefront" = "ImportJob"."storefront"
          AND ig."deletedAt" IS NULL
          AND ig."createdAt" >= "ImportJob"."createdAt"
          AND NOT EXISTS (
            SELECT 1 FROM "LibraryItem" li
            WHERE li."userId" = ig."userId"
              AND li."gameId" = ig."gameId"
              AND li."createdAt" < "ImportJob"."createdAt"
          )
      ),
      "needsMatch" = (
        SELECT count(*)::int FROM "ImportedGame" ig
        WHERE ig."userId" = "ImportJob"."userId"
          AND ig."storefront" = "ImportJob"."storefront"
          AND ig."deletedAt" IS NULL
          AND ig."igdbMatchStatus" <> 'IGNORED'
          AND ig."lookedUpAt" IS NOT NULL
          AND ig."gameId" IS NULL
      )
    WHERE "id" = ${jobId}
      AND "status" IN ('GATHERING', 'LOOKING_UP')
      AND cardinality("doneChunkIndexes") = "totalChunks"
    RETURNING *
  `;

  return rows[0] ?? null;
}
