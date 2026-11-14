import { env } from "@env";

import type { SyncQueue } from "@/shared/api/queue";
import { UpstreamError } from "@/shared/lib/errors";

import { inlineSyncQueue } from "./inline-queue";

export type SyncQueueMode = "inline" | "sqs";

export function resolveSyncQueueMode(): SyncQueueMode | null {
  if (env.STOREFRONT_SYNC_QUEUE) {
    return env.STOREFRONT_SYNC_QUEUE;
  }
  return env.NODE_ENV === "production" ? null : "inline";
}

export function getSyncQueue(): SyncQueue {
  const mode = resolveSyncQueueMode();
  switch (mode) {
    case "inline":
      return inlineSyncQueue;
    case "sqs":
      throw new UpstreamError(
        "STOREFRONT_SYNC_QUEUE=sqs is not implemented yet; use inline"
      );
    case null:
      throw new UpstreamError("Background sync is not configured");
  }
}
