import { prisma } from "@/shared/lib/db.server";

import type { ImportJob } from "../model/types";

/**
 * Finish a GATHERING or LOOKING_UP job whose chunks are all done
 * (`cardinality("doneChunkIndexes") = "totalChunks"`; a job with no chunks
 * qualifies at once). Returns the finished job, or `null` when chunks are
 * outstanding or the job is not active, so concurrent last-chunk workers
 * finalize exactly once.
 */
export async function finalizeImportJobIfComplete(
  jobId: string
): Promise<ImportJob | null> {
  const rows = await prisma.$queryRaw<ImportJob[]>`
    UPDATE "ImportJob"
    SET "status" = 'FINISHED', "finishedAt" = now(), "updatedAt" = now()
    WHERE "id" = ${jobId}
      AND "status" IN ('GATHERING', 'LOOKING_UP')
      AND cardinality("doneChunkIndexes") = "totalChunks"
    RETURNING *
  `;

  return rows[0] ?? null;
}
