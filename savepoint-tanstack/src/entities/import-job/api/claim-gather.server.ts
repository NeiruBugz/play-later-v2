import { prisma } from "@/shared/lib/db.server";

import type { ImportJob } from "../model/types";

/**
 * Claim a job for the gather step. QUEUED and GATHERING both qualify (a
 * redelivered gather message re-claims); any other state returns `null` and the
 * caller acknowledges and drops the message.
 */
export async function claimGather(jobId: string): Promise<ImportJob | null> {
  const rows = await prisma.$queryRaw<ImportJob[]>`
    UPDATE "ImportJob"
    SET "status" = 'GATHERING', "updatedAt" = now()
    WHERE "id" = ${jobId} AND "status" IN ('QUEUED', 'GATHERING')
    RETURNING *
  `;

  return rows[0] ?? null;
}
