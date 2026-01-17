"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  LIBRARY_STATUS_CONFIG,
  type StatusBadgeVariant,
} from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";

import { useUniquePlatforms } from "../hooks/use-unique-platforms";
import { PlatformFilterCombobox } from "./platform-filter-combobox";

const PRIMARY_SORT_OPTIONS = [
  { value: "updatedAt-desc", label: "Recently Updated" },
  { value: "createdAt-desc", label: "Recently Added" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
] as const;

const ADVANCED_SORT_OPTIONS = [
  { value: "releaseDate-desc", label: "Release Date (Newest)" },
  { value: "releaseDate-asc", label: "Release Date (Oldest)" },
  { value: "startedAt-desc", label: "Started Date" },
  { value: "completedAt-desc", label: "Completed Date" },
] as const;

function getStatusFilterStyles(badgeVariant: StatusBadgeVariant): {
  active: string;
  inactive: string;
} {
  const cssVarName = `--status-${badgeVariant}`;
  return {
    active: `bg-[var(${cssVarName})] text-[var(${cssVarName}-foreground)] hover:bg-[var(${cssVarName})]/90 border-transparent`,
    inactive: `border-[var(${cssVarName})]/30 text-[var(${cssVarName})] hover:bg-[var(${cssVarName})]/10`,
  };
}

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

  const getCurrentSortValue = useCallback((): string => {
    const sortBy = searchParams.get("sortBy") ?? "updatedAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    return `${sortBy}-${sortOrder}`;
  }, [searchParams]);

  const [showAdvancedSort, setShowAdvancedSort] = useState(false);
  const currentSortValue = getCurrentSortValue();
  const isAdvancedSort = ADVANCED_SORT_OPTIONS.some(
    (opt) => opt.value === currentSortValue
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const [sortBy, sortOrder] = value.split("-");
      const params = new URLSearchParams(searchParams.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      router.push(`/library?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const hasActiveFilters = Boolean(
    searchParams.get("status") ||
    searchParams.get("platform") ||
    searchParams.get("search")
  );
  const currentStatus = searchParams.get("status") ?? "__all__";

  return (
    <div className="mb-2xl space-y-lg">
      {/* Row 1: Status Filter */}
      <div>
        {/* Mobile: Select dropdown */}
        <div className="md:hidden">
          <Select
            value={currentStatus}
            onValueChange={(value) =>
              updateFilter("status", value === "__all__" ? undefined : value)
            }
          >
            <SelectTrigger aria-label="Filter by status">
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

        {/* Desktop: Button pills */}
        <div className="gap-md hidden md:flex md:flex-wrap">
          <Button
            variant={currentStatus === "__all__" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("status", undefined)}
            aria-label="Show all statuses"
            aria-pressed={currentStatus === "__all__"}
          >
            All
          </Button>
          {LIBRARY_STATUS_CONFIG.map((config) => {
            const isActive = currentStatus === config.value;
            const statusStyles = getStatusFilterStyles(config.badgeVariant);
            return (
              <Button
                key={config.value}
                variant="outline"
                size="sm"
                onClick={() => updateFilter("status", config.value)}
                aria-label={`Filter by ${config.label}`}
                aria-pressed={isActive}
                className={cn(
                  "transition-all",
                  isActive ? statusStyles.active : statusStyles.inactive
                )}
              >
                {config.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Platform, Search, Sort, Clear */}
      <div className="gap-md flex flex-col md:flex-row md:items-center">
        {/* Platform Filter */}
        <div className="w-full md:w-[220px]">
          <PlatformFilterCombobox
            value={searchParams.get("platform") ?? "__all__"}
            onValueChange={(value) =>
              updateFilter("platform", value === "__all__" ? undefined : value)
            }
            platforms={platforms}
            isLoading={isLoadingPlatforms}
          />
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search games..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Search games by title"
          />
        </div>

        {/* Sort Control */}
        <div className="w-full md:w-[200px]">
          <Select
            value={currentSortValue}
            onValueChange={handleSortChange}
            onOpenChange={(open) => {
              if (!open) setShowAdvancedSort(false);
            }}
          >
            <SelectTrigger aria-label="Sort by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {PRIMARY_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}

              <Collapsible open={showAdvancedSort || isAdvancedSort}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-sm hover:bg-accent w-full justify-start px-2 py-1.5 text-sm font-normal"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowAdvancedSort(!showAdvancedSort);
                    }}
                    aria-label={
                      showAdvancedSort
                        ? "Hide advanced sort options"
                        : "Show advanced sort options"
                    }
                  >
                    More
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        (showAdvancedSort || isAdvancedSort) && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {ADVANCED_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-9 w-full md:w-auto"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="ml-md md:sr-only">Clear</span>
          </Button>
        )}
      </div>
    </div>
  );
}
