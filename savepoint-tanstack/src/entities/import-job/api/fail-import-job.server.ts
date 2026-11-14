import { prisma } from "@/shared/lib/db.server";

import type { ImportFailureCode, ImportJob } from "../model/types";

/**
 * Fail a job that is still active. Terminal jobs are untouched (`null`), so the
 * first failure code wins.
 */
export async function failImportJob(
  jobId: string,
  failureCode: ImportFailureCode
): Promise<ImportJob | null> {
  const rows = await prisma.$queryRaw<ImportJob[]>`
    UPDATE "ImportJob"
    SET
      "status" = 'FAILED',
      "failureCode" = ${failureCode}::"ImportFailureCode",
      "finishedAt" = now(),
      "updatedAt" = now()
    WHERE "id" = ${jobId}
      AND "status" IN ('QUEUED', 'GATHERING', 'LOOKING_UP')
    RETURNING *
  `;

  return rows[0] ?? null;
}
