import { prisma } from "@/shared/lib/db.server";

import type { GatherPlan, ImportJob } from "../model/types";

/**
 * Store the gather plan and leave GATHERING in one UPDATE: LOOKING_UP when
 * there are chunks to look up, FINISHED (with `finishedAt` and the finish-time
 * `newGames` / `needsMatch` summary, as `finalizeImportJobIfComplete` writes
 * them) when there are none. Returns `null` unless the job was GATHERING, so a
 * redelivered gather cannot overwrite a plan that is already being worked.
 */
export async function recordGatherPlan(
  jobId: string,
  plan: GatherPlan
): Promise<ImportJob | null> {
  const rows = await prisma.$queryRaw<ImportJob[]>`
    UPDATE "ImportJob"
    SET
      "totalToLookUp" = ${plan.totalToLookUp}::int,
      "lookedUp" = ${plan.lookedUp}::int,
      "refreshedGames" = ${plan.refreshedGames}::int,
      "totalChunks" = ${plan.totalChunks}::int,
      "status" = CASE WHEN ${plan.totalChunks}::int = 0
        THEN 'FINISHED'::"ImportJobStatus"
        ELSE 'LOOKING_UP'::"ImportJobStatus" END,
      "finishedAt" = CASE WHEN ${plan.totalChunks}::int = 0
        THEN now() ELSE NULL END,
      "newGames" = CASE WHEN ${plan.totalChunks}::int = 0
        THEN (
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
        )
        ELSE "newGames" END,
      "needsMatch" = CASE WHEN ${plan.totalChunks}::int = 0
        THEN (
          SELECT count(*)::int FROM "ImportedGame" ig
          WHERE ig."userId" = "ImportJob"."userId"
            AND ig."storefront" = "ImportJob"."storefront"
            AND ig."deletedAt" IS NULL
            AND ig."igdbMatchStatus" <> 'IGNORED'
            AND ig."lookedUpAt" IS NOT NULL
            AND ig."gameId" IS NULL
        )
        ELSE "needsMatch" END,
      "updatedAt" = now()
    WHERE "id" = ${jobId} AND "status" = 'GATHERING'
    RETURNING *
  `;

  return rows[0] ?? null;
}
