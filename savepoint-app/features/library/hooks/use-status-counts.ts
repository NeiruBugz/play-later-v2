"use client";

import { useQuery } from "@tanstack/react-query";

import {
  LIBRARY_DATA_GC_TIME_MS,
  LIBRARY_DATA_STALE_TIME_MS,
} from "@/shared/constants";
import { LibraryItemStatus } from "@/shared/types";

type StatusCountFilters = {
  platform?: string;
  search?: string;
};

type StatusCountsApiResponse =
  | { success: true; data: Record<LibraryItemStatus, number> }
  | { success: false; error: string };

function buildZeroedCounts(): Record<LibraryItemStatus, number> {
  return Object.values(LibraryItemStatus).reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    {} as Record<LibraryItemStatus, number>
  );
}

export function useStatusCounts(filters: StatusCountFilters = {}) {
  const { platform, search } = filters;

  return useQuery({
    queryKey: ["library", "status-counts", { platform, search }],
    queryFn: async (): Promise<Record<LibraryItemStatus, number>> => {
      const params = new URLSearchParams();
      if (platform) params.set("platform", platform);
      if (search) params.set("search", search);

      const qs = params.toString();
      const response = await fetch(
        `/api/library/status-counts${qs ? `?${qs}` : ""}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch status counts: ${response.statusText}`
        );
      }

      const json = (await response.json()) as StatusCountsApiResponse;
      if (!json.success) {
        throw new Error(json.error);
      }
      return json.data;
    },
    placeholderData: buildZeroedCounts,
    staleTime: LIBRARY_DATA_STALE_TIME_MS,
    gcTime: LIBRARY_DATA_GC_TIME_MS,
  });
}
