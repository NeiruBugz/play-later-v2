"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import type { LibraryItemWithGameDomain } from "@/features/library/types";
import {
  LIBRARY_DATA_GC_TIME_MS,
  LIBRARY_DATA_STALE_TIME_MS,
  LIBRARY_PAGE_SIZE,
} from "@/shared/constants";
import type { LibraryItemStatus } from "@/shared/types";

export type LibraryFilters = {
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy?:
    | "updatedAt"
    | "createdAt"
    | "releaseDate"
    | "startedAt"
    | "completedAt"
    | "title"
    | "rating-desc"
    | "rating-asc";
  sortOrder?: "asc" | "desc";
  minRating?: number;
  unratedOnly?: boolean;
};

type LibraryPageData = {
  items: LibraryItemWithGameDomain[];
  total: number;
  hasMore: boolean;
};

type LibraryApiResponse =
  | {
      success: true;
      data: LibraryPageData;
    }
  | {
      success: false;
      error: string;
    };

export function useLibraryData(filters: LibraryFilters = {}) {
  return useInfiniteQuery({
    queryKey: ["library", filters],
    queryFn: async ({ pageParam }): Promise<LibraryPageData> => {
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([key, value]) => {
            if (value === undefined) return false;
            if (key === "unratedOnly") return value === true;
            return true;
          })
          .map(([key, value]) => {
            if (key === "unratedOnly") {
              return [key, "1"];
            }
            return [key, String(value)];
          })
      );
      params.set("offset", String(pageParam));
      params.set("limit", String(LIBRARY_PAGE_SIZE));

      const response = await fetch(`/api/library?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch library: ${response.statusText}`);
      }

      const json = (await response.json()) as LibraryApiResponse;

      if ("error" in json) {
        throw new Error(json.error);
      }
      return json.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      const totalFetched = allPages.reduce(
        (sum, page) => sum + page.items.length,
        0
      );
      return totalFetched;
    },
    staleTime: LIBRARY_DATA_STALE_TIME_MS,
    gcTime: LIBRARY_DATA_GC_TIME_MS,
    placeholderData: keepPreviousData,
  });
}
