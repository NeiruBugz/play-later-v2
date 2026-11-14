import { prisma } from "@/shared/lib/db.server";

import type { ImportJob, Storefront } from "../model/types";

/**
 * Fail the user's active job for the storefront once it has made no progress
 * for 30 minutes. Staleness is judged by the database clock inside one
 * conditional UPDATE, so concurrent readers converge on the same result and
 * terminal jobs are never touched. Lazy by design: no sweeper runs, the next
 * read or start of the storefront's sync expires it.
 */
export async function expireStaleImportJob(
  userId: string,
  storefront: Storefront
): Promise<ImportJob | null> {
  const rows = await prisma.$queryRaw<ImportJob[]>`
    UPDATE "ImportJob"
    SET
      "status" = 'FAILED',
      "failureCode" = 'STALLED',
      "finishedAt" = now(),
      "updatedAt" = now()
    WHERE "userId" = ${userId}
      AND "storefront" = ${storefront}::"Storefront"
      AND "status" IN ('QUEUED', 'GATHERING', 'LOOKING_UP')
      AND "updatedAt" < now() - interval '30 minutes'
    RETURNING *
  `;

  return rows[0] ?? null;
}
