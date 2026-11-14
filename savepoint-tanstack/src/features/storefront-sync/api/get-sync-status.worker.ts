import { getLatestImportJob } from "@/entities/import-job/api/get-latest-import-job.server";
import { UnauthorizedError } from "@/shared/lib/errors";

import type { SteamSyncStatus } from "../model/types";

export async function getSteamSyncStatusWorker(
  userId: string | undefined
): Promise<SteamSyncStatus | null> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const job = await getLatestImportJob(userId, "STEAM");
  if (!job) {
    return null;
  }

  return {
    jobId: job.id,
    status: job.status,
    totalToLookUp: job.totalToLookUp,
    lookedUp: job.lookedUp,
    newGames: job.newGames,
    refreshedGames: job.refreshedGames,
    addedToLibrary: job.addedToLibrary,
    needsMatch: job.needsMatch,
    addAllToLibrary: job.addAllToLibrary,
    failureCode: job.failureCode,
    finishedAt: job.finishedAt,
    noticeSeen: job.noticeSeenAt !== null,
  };
}
