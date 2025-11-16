"use client";

import type { LibraryItemStatus } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

import type { LibraryItemWithGameAndCount } from "@/shared/types";

/**
 * Filter parameters for library data fetching
 */
export type LibraryFilters = {
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy?: "createdAt" | "releaseDate" | "startedAt" | "completedAt";
  sortOrder?: "asc" | "desc";
};

/**
 * API response structure from /api/library endpoint
 */
type LibraryApiResponse =
  | {
      success: true;
      data: LibraryItemWithGameAndCount[];
    }
  | {
      success: false;
      error: string;
    };

/**
 * TanStack Query hook for fetching library data
 *
 * @param filters - Optional filters for library items (status, platform, search, sorting)
 * @returns Query result with library items data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useLibraryData({
 *   status: 'CURRENTLY_EXPLORING',
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc'
 * });
 * ```
 */
export function useLibraryData(filters: LibraryFilters = {}) {
  return useQuery({
    queryKey: ["library", filters],
    queryFn: async (): Promise<LibraryItemWithGameAndCount[]> => {
      // Build query parameters from filters, excluding undefined values
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      );

      // Fetch from API endpoint
      const response = await fetch(`/api/library?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch library: ${response.statusText}`);
      }

      // Parse JSON response
      const json = (await response.json()) as LibraryApiResponse;

      // Handle API-level errors (type narrowing)
      if ("error" in json) {
        throw new Error(json.error);
      }

      return json.data;
    },
    staleTime: 30_000, // 30 seconds - data considered fresh for this duration
    gcTime: 5 * 60_000, // 5 minutes - cache garbage collection time
  });
}
