"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

import { STATUS_OPTIONS } from "../../game-detail/ui/library-modal/constants";

/**
 * Library filters component - provides filter controls for the library view
 *
 * Features:
 * - Status dropdown filter (all LibraryItemStatus enum values)
 * - Platform dropdown filter (platform names)
 * - Text search input with debouncing (300ms delay)
 * - Clear filters button (shown when filters are active)
 * - URL state management for bookmarkable filters
 *
 * All filter changes update URL query parameters which triggers
 * TanStack Query to refetch library data automatically.
 *
 * URL Parameters:
 * - status: LibraryItemStatus enum value
 * - platform: Platform name string
 * - search: Game title search string
 * - sortBy: Sort field (createdAt, releaseDate, startedAt, completedAt)
 * - sortOrder: Sort direction (asc, desc)
 *
 * @example
 * ```tsx
 * // In library page
 * <LibraryFilters />
 * <LibraryGrid />
 * ```
 */
export function LibraryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? ""
  );

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  /**
   * Update a single filter parameter in the URL
   * Preserves other query parameters (sorting, other filters)
   */
  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      router.push(`/library?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  /**
   * Clear all filter parameters from URL
   * Preserves sorting parameters (sortBy, sortOrder)
   */
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Remove filter params but preserve sorting
    params.delete("status");
    params.delete("platform");
    params.delete("search");

    router.push(`/library?${params.toString()}`, { scroll: false });
    setSearchInput("");
  }, [router, searchParams]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  useEffect(() => {
    const currentSearch = searchParams.get("search");
    if (debouncedSearch !== currentSearch) {
      updateFilter("search", debouncedSearch || undefined);
    }
  }, [debouncedSearch, searchParams, updateFilter]);

  const hasActiveFilters = Boolean(
    searchParams.get("status") ||
      searchParams.get("platform") ||
      searchParams.get("search")
  );

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="w-full space-y-2 md:w-auto md:flex-1">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={searchParams.get("status") ?? "__all__"}
            onValueChange={(value) =>
              updateFilter("status", value === "__all__" ? undefined : value)
            }
          >
            <SelectTrigger id="status-filter" aria-label="Filter by status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full space-y-2 md:w-auto md:flex-1">
          <Label htmlFor="platform-filter">Platform</Label>
          <Select
            value={searchParams.get("platform") ?? "__all__"}
            onValueChange={(value) =>
              updateFilter("platform", value === "__all__" ? undefined : value)
            }
          >
            <SelectTrigger id="platform-filter" aria-label="Filter by platform">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Platforms</SelectItem>
              <SelectItem value="PlayStation 5">PlayStation 5</SelectItem>
              <SelectItem value="PlayStation 4">PlayStation 4</SelectItem>
              <SelectItem value="Xbox Series X/S">Xbox Series X/S</SelectItem>
              <SelectItem value="Xbox One">Xbox One</SelectItem>
              <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
              <SelectItem value="PC">PC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full space-y-2 md:flex-1">
          <Label htmlFor="search-input">Search</Label>
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              id="search-input"
              type="search"
              placeholder="Search games..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              aria-label="Search games by title"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="default"
            onClick={clearAllFilters}
            className="w-full md:mb-0 md:w-auto"
            aria-label="Clear all filters"
          >
            <X className="mr-2 h-4 w-4" aria-hidden="true" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
