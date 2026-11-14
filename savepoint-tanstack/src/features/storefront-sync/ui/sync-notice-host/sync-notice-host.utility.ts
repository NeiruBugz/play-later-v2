import type { SteamSyncStatus } from "../../model/types";
import { isSyncActive } from "../steam-sync-status";

export const NOTICE_POLL_INTERVAL_MS = 20_000;
export const NOTICE_STALE_TIME_MS = 60_000;

export const noticeToastId = (jobId: string) => `steam-sync-notice-${jobId}`;

export const hasUnseenFinishedNotice = (
  status: SteamSyncStatus | null | undefined
) => status != null && status.status === "FINISHED" && !status.noticeSeen;

export const shouldPollNotice = (status: SteamSyncStatus | null | undefined) =>
  isSyncActive(status) || hasUnseenFinishedNotice(status);
