"use client";

import type { LibraryItemStatus } from "@prisma/client";
import { useSearchParams } from "next/navigation";

/**
 * Type definition for library filter values extracted from URL params
 */
export type LibraryFilterValues = {
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy: "createdAt" | "releaseDate" | "startedAt" | "completedAt";
  sortOrder: "asc" | "desc";
};

/**
 * Hook to read and parse library filter values from URL search parameters
 *
 * This hook extracts filter state from the URL, making filters bookmarkable
 * and shareable. It provides type-safe access to all filter parameters with
 * sensible defaults.
 *
 * @returns Object containing all filter values with proper types
 *
 * @example
 * ```tsx
 * function LibraryGrid() {
 *   const filters = useLibraryFilters();
 *   const { data } = useLibraryData(filters);
 *
 *   // filters.status will be a valid LibraryItemStatus or undefined
 *   // filters.sortBy will default to 'createdAt'
 *   // filters.sortOrder will default to 'desc'
 * }
 * ```
 */
export function useLibraryFilters(): LibraryFilterValues {
  const searchParams = useSearchParams();

  // Extract status with type safety
  const statusParam = searchParams.get("status");
  const status = statusParam as LibraryItemStatus | null;

  // Extract other filter parameters
  const platform = searchParams.get("platform") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  // Extract sorting with defaults
  const sortByParam = searchParams.get("sortBy");
  const sortBy =
    sortByParam === "releaseDate" ||
    sortByParam === "startedAt" ||
    sortByParam === "completedAt"
      ? sortByParam
      : "createdAt";

  const sortOrderParam = searchParams.get("sortOrder");
  const sortOrder = sortOrderParam === "asc" ? "asc" : "desc";

  return {
    status: status ?? undefined,
    platform,
    search,
    sortBy,
    sortOrder,
  };
}
