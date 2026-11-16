import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import type { SteamSyncStatus } from "../model/types";
import { getSteamSyncStatusWorker } from "./get-sync-status.worker";

export const getSteamSyncStatusFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SteamSyncStatus | null> => {
    const userId = await requireUserId();
    return getSteamSyncStatusWorker(userId);
  }
);
