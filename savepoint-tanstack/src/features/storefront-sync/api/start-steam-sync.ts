import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import type { StartSteamSyncResult } from "../model/types";
import {
  START_STEAM_SYNC_INPUT,
  startSteamSyncWorker,
} from "./start-sync.worker";

export const startSteamSyncFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => START_STEAM_SYNC_INPUT.parse(data))
  .handler(async ({ data }): Promise<StartSteamSyncResult> => {
    const parsed = START_STEAM_SYNC_INPUT.parse(data);
    const userId = await requireUserId();
    return startSteamSyncWorker(userId, parsed);
  });
