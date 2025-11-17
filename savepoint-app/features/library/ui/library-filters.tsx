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
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";

import { useUniquePlatforms } from "../hooks/use-unique-platforms";
import { PlatformFilterCombobox } from "./platform-filter-combobox";

export function LibraryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? ""
  );
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const { data: platforms, isLoading: isLoadingPlatforms } =
    useUniquePlatforms();

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

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

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
  const currentStatus = searchParams.get("status") ?? "__all__";

  return (
    <div className="mb-6 space-y-4">
      {/* Status filter - full width row */}
      <div className="space-y-2">
        <Label htmlFor="status-filter">Status</Label>
        {/* Mobile: Select dropdown */}
        <div className="md:hidden">
          <Select
            value={currentStatus}
            onValueChange={(value) =>
              updateFilter("status", value === "__all__" ? undefined : value)
            }
          >
            <SelectTrigger id="status-filter" aria-label="Filter by status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              {LIBRARY_STATUS_CONFIG.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Desktop: Button group */}
        <div className="hidden md:flex md:flex-wrap md:gap-2">
          <Button
            variant={currentStatus === "__all__" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("status", undefined)}
            aria-label="Show all statuses"
            aria-pressed={currentStatus === "__all__"}
          >
            All Statuses
          </Button>
          {LIBRARY_STATUS_CONFIG.map((option) => {
            const isActive = currentStatus === option.value;
            return (
              <Button
                key={option.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter("status", option.value)}
                aria-label={`Filter by ${option.label}`}
                aria-pressed={isActive}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Other filters - row layout */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="w-full space-y-2 md:w-auto md:flex-1">
          <Label htmlFor="platform-filter">Platform</Label>
          <PlatformFilterCombobox
            value={searchParams.get("platform") ?? "__all__"}
            onValueChange={(value) =>
              updateFilter("platform", value === "__all__" ? undefined : value)
            }
            platforms={platforms}
            isLoading={isLoadingPlatforms}
          />
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
