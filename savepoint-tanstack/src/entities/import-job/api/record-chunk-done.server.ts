import { prisma } from "@/shared/lib/db.server";

import type { ChunkDoneCounters, ChunkDoneResult } from "../model/types";

/**
 * Mark one lookup chunk done and add its counters to the job in a single
 * UPDATE. `NOT ($chunkIndex = ANY("doneChunkIndexes"))` makes a redelivered
 * chunk a no-op, so `lookedUp` and `addedToLibrary` never double-count. Only a
 * LOOKING_UP job is touched; a stale chunk for a FINISHED or FAILED job applies
 * nothing.
 *
 * `applied` says whether this call recorded the chunk. `done` and `total` are
 * the job's chunk progress after the call (0 and 0 for an unknown job).
 */
export async function recordChunkDone(
  jobId: string,
  chunkIndex: number,
  { lookupCount, added }: ChunkDoneCounters
): Promise<ChunkDoneResult> {
  const updated = await prisma.$queryRaw<
    Array<{ done: number; total: number }>
  >`
    UPDATE "ImportJob"
    SET
      "doneChunkIndexes" = array_append("doneChunkIndexes", ${chunkIndex}::int),
      "lookedUp" = "lookedUp" + ${lookupCount}::int,
      "addedToLibrary" = "addedToLibrary" + ${added}::int,
      "updatedAt" = now()
    WHERE "id" = ${jobId}
      AND "status" = 'LOOKING_UP'
      AND NOT (${chunkIndex}::int = ANY("doneChunkIndexes"))
    RETURNING cardinality("doneChunkIndexes")::int AS done, "totalChunks" AS total
  `;
  if (updated[0]) return { applied: true, ...updated[0] };

  const job = await prisma.importJob.findUnique({
    where: { id: jobId },
    select: { doneChunkIndexes: true, totalChunks: true },
  });
  return {
    applied: false,
    done: job?.doneChunkIndexes.length ?? 0,
    total: job?.totalChunks ?? 0,
  };
}
