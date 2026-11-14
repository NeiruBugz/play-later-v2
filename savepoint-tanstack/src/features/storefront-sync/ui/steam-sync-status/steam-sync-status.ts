import { queryOptions, useQuery } from "@tanstack/react-query";

import { getSteamSyncStatusFn } from "../../api/get-steam-sync-status";
import type { SteamSyncStatus } from "../../model/types";

const ACTIVE_STATUSES: ReadonlyArray<SteamSyncStatus["status"]> = [
  "QUEUED",
  "GATHERING",
  "LOOKING_UP",
];

const STATUS_POLL_INTERVAL_MS = 3000;

export const STEAM_SYNC_STATUS_QUERY_KEY = [
  "storefront-sync",
  "status",
  "STEAM",
] as const;

export const isSyncActive = (status: SteamSyncStatus | null | undefined) =>
  status != null && ACTIVE_STATUSES.includes(status.status);

export const steamSyncStatusQueryOptions = queryOptions({
  queryKey: STEAM_SYNC_STATUS_QUERY_KEY,
  queryFn: () => getSteamSyncStatusFn(),
  refetchInterval: (query) =>
    isSyncActive(query.state.data) ? STATUS_POLL_INTERVAL_MS : false,
});

export const useSteamSyncStatus = () => useQuery(steamSyncStatusQueryOptions);
