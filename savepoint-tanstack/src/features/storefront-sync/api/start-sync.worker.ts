import { z } from "zod";

import { createImportJob } from "@/entities/import-job/api/create-import-job.server";
import { getActiveImportJob } from "@/entities/import-job/api/get-active-import-job.server";
import type { ImportJob } from "@/entities/import-job/model";
import { prisma } from "@/shared/lib/db.server";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/lib/errors";

import type { StartSteamSyncResult } from "../model/types";
import { getSyncQueue } from "./get-sync-queue";

export const START_STEAM_SYNC_INPUT = z.object({
  addAllToLibrary: z.boolean(),
});

export type StartSteamSyncInput = z.infer<typeof START_STEAM_SYNC_INPUT>;

export async function startSteamSyncWorker(
  userId: string | undefined,
  data: unknown
): Promise<StartSteamSyncResult> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }
  const input = START_STEAM_SYNC_INPUT.parse(data);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { steamId64: true },
  });
  if (!user?.steamId64) {
    throw new ValidationError("Connect Steam first to sync your library", {
      userId,
    });
  }

  const created = await createImportJob(userId, {
    storefront: "STEAM",
    addAllToLibrary: input.addAllToLibrary,
    storefrontAccountId: user.steamId64,
  });
  if (!created) {
    const active = await getActiveImportJob(userId, "STEAM");
    if (!active) {
      throw new ConflictError("Sync state changed while starting, try again", {
        userId,
      });
    }
    return toResult(active, true);
  }

  await getSyncQueue().send("gather", { v: 1, jobId: created.id });
  return toResult(created, false);
}

function toResult(
  job: ImportJob,
  alreadyRunning: boolean
): StartSteamSyncResult {
  return { jobId: job.id, status: job.status, alreadyRunning };
}
