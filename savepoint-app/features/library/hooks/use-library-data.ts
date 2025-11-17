"use client";

import type { LibraryItemStatus } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

import {
  LIBRARY_DATA_GC_TIME_MS,
  LIBRARY_DATA_STALE_TIME_MS,
} from "@/shared/constants";
import type { LibraryItemWithGameAndCount } from "@/shared/types";

export type LibraryFilters = {
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy?: "createdAt" | "releaseDate" | "startedAt" | "completedAt";
  sortOrder?: "asc" | "desc";
};

type LibraryApiResponse =
  | {
      success: true;
      data: LibraryItemWithGameAndCount[];
    }
  | {
      success: false;
      error: string;
    };

export function useLibraryData(filters: LibraryFilters = {}) {
  return useQuery({
    queryKey: ["library", filters],
    queryFn: async (): Promise<LibraryItemWithGameAndCount[]> => {
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      );

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
    staleTime: LIBRARY_DATA_STALE_TIME_MS,
    gcTime: LIBRARY_DATA_GC_TIME_MS,
  });
}
