"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

/**
 * Sort option configuration type
 */
type SortOption = {
  value: string;
  label: string;
  sortBy: "createdAt" | "releaseDate" | "startedAt" | "completedAt";
  sortOrder: "asc" | "desc";
};

/**
 * Available sort options for library items
 *
 * Each option maps to a combination of sortBy field and sortOrder direction
 * Default option: "Recently Added" (createdAt desc)
 */
const SORT_OPTIONS: SortOption[] = [
  {
    value: "createdAt-desc",
    label: "Recently Added",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  {
    value: "createdAt-asc",
    label: "Oldest First",
    sortBy: "createdAt",
    sortOrder: "asc",
  },
  {
    value: "releaseDate-desc",
    label: "Release Date (Newest)",
    sortBy: "releaseDate",
    sortOrder: "desc",
  },
  {
    value: "releaseDate-asc",
    label: "Release Date (Oldest)",
    sortBy: "releaseDate",
    sortOrder: "asc",
  },
  {
    value: "startedAt-desc",
    label: "Started (Most Recent)",
    sortBy: "startedAt",
    sortOrder: "desc",
  },
  {
    value: "startedAt-asc",
    label: "Started (Oldest)",
    sortBy: "startedAt",
    sortOrder: "asc",
  },
  {
    value: "completedAt-desc",
    label: "Completed (Most Recent)",
    sortBy: "completedAt",
    sortOrder: "desc",
  },
  {
    value: "completedAt-asc",
    label: "Completed (Oldest)",
    sortBy: "completedAt",
    sortOrder: "asc",
  },
];

/**
 * Library sort select component - dropdown for sorting library items
 *
 * Features:
 * - Multiple sort criteria: createdAt, releaseDate, startedAt, completedAt
 * - Both ascending and descending order for each field
 * - URL state management for bookmarkable sort preferences
 * - Default sort: "Recently Added" (createdAt desc)
 *
 * The component updates both sortBy and sortOrder URL parameters
 * simultaneously when the user selects a sort option. This triggers
 * TanStack Query to refetch library data with the new sort order.
 *
 * URL Parameters Updated:
 * - sortBy: Field to sort by (createdAt, releaseDate, startedAt, completedAt)
 * - sortOrder: Sort direction (asc, desc)
 *
 * @example
 * ```tsx
 * // In library page
 * <LibraryFilters />
 * <LibrarySortSelect />
 * <LibraryGrid />
 * ```
 */
export function LibrarySortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Get current sort value from URL params
   * Returns combined value like "createdAt-desc"
   * Defaults to "createdAt-desc" if no sort params in URL
   */
  const getCurrentSortValue = useCallback((): string => {
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    return `${sortBy}-${sortOrder}`;
  }, [searchParams]);

  /**
   * Handle sort selection change
   *
   * Parses the combined value (e.g., "createdAt-desc") into separate
   * sortBy and sortOrder parameters and updates the URL.
   * Preserves all other query parameters (filters).
   */
  const handleSortChange = useCallback(
    (value: string) => {
      const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value);

      if (!selectedOption) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      // Update both sortBy and sortOrder parameters
      params.set("sortBy", selectedOption.sortBy);
      params.set("sortOrder", selectedOption.sortOrder);

      router.push(`/library?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="sort-select" className="text-muted-foreground text-sm">
        Sort by
      </Label>
      <Select value={getCurrentSortValue()} onValueChange={handleSortChange}>
        <SelectTrigger id="sort-select" className="w-[200px]">
          <SelectValue placeholder="Recently Added" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
