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
import { Label } from "@/shared/components/ui/label";
import { RatingInput } from "@/shared/components/ui/rating-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
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
  { value: "rating-desc", label: "Highest rated" },
  { value: "rating-asc", label: "Lowest rated" },
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

  const updateMergedParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `/library?${qs}` : `/library`, { scroll: false });
    },
    [router, searchParams]
  );

  const minRatingParam = searchParams.get("minRating");
  const parsedMinRating = minRatingParam ? Number(minRatingParam) : null;
  const minRatingValue =
    parsedMinRating !== null &&
    Number.isFinite(parsedMinRating) &&
    parsedMinRating >= 1 &&
    parsedMinRating <= 10
      ? parsedMinRating
      : null;
  const unratedOnly = searchParams.get("unratedOnly") === "1";

  const handleMinRatingChange = useCallback(
    (next: number | null) => {
      updateMergedParams({
        minRating: next === null ? null : String(next),
      });
    },
    [updateMergedParams]
  );

  const handleClearMinRating = useCallback(() => {
    updateMergedParams({ minRating: null });
  }, [updateMergedParams]);

  const handleUnratedOnlyChange = useCallback(
    (checked: boolean) => {
      updateMergedParams({ unratedOnly: checked ? "1" : null });
    },
    [updateMergedParams]
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
    const currentSearch = searchParams.get("search") ?? "";
    if (debouncedSearch !== currentSearch) {
      updateFilter("search", debouncedSearch || undefined);
    }
  }, [debouncedSearch, searchParams, updateFilter]);

  const getCurrentSortValue = useCallback((): string => {
    const sortBy = searchParams.get("sortBy") ?? "updatedAt";
    if (sortBy === "rating-desc" || sortBy === "rating-asc") {
      return sortBy;
    }
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    return `${sortBy}-${sortOrder}`;
  }, [searchParams]);

  const currentSortValue = getCurrentSortValue();
  const isAdvancedSort = ADVANCED_SORT_OPTIONS.some(
    (opt) => opt.value === currentSortValue
  );
  const [showAdvancedSort, setShowAdvancedSort] = useState(isAdvancedSort);
  const advancedOpen = showAdvancedSort || isAdvancedSort;

  const handleSortChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "rating-desc" || value === "rating-asc") {
        params.set("sortBy", value);
        params.delete("sortOrder");
      } else {
        const [sortBy, sortOrder] = value.split("-");
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);
      }
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [
    searchParams.get("platform"),
    searchParams.get("search"),
  ].filter(Boolean).length;

  return (
    <div className="mb-2xl space-y-lg">
      {/* Row 1: Status Filter */}
      <div>
        {/* Mobile: Horizontal scrolling pills */}
        <div className="md:hidden">
          <div className="gap-sm pb-sm scrollbar-none -mx-1 flex overflow-x-auto px-1">
            <Button
              variant={currentStatus === "__all__" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("status", undefined)}
              aria-label="Show all statuses"
              aria-pressed={currentStatus === "__all__"}
              className="shrink-0"
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
                    "shrink-0 transition-all",
                    isActive ? statusStyles.active : statusStyles.inactive
                  )}
                >
                  {config.label}
                </Button>
              );
            })}
          </div>
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

      {/* Row 2: Search (always visible on all breakpoints) */}
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Filter library..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
          aria-label="Filter library by title"
        />
      </div>

      {/* Row 3: Platform + Sort — inline on desktop, collapsible on mobile */}
      <div className="gap-md hidden md:flex md:items-center">
        <div className="w-[220px]">
          <PlatformFilterCombobox
            value={searchParams.get("platform") ?? "__all__"}
            onValueChange={(value) =>
              updateFilter("platform", value === "__all__" ? undefined : value)
            }
            platforms={platforms}
            isLoading={isLoadingPlatforms}
          />
        </div>

        <div className="w-[200px]">
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

              <Collapsible open={advancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-sm hover:bg-accent w-full justify-start px-2 py-1.5 text-sm font-normal"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowAdvancedSort(!showAdvancedSort);
                    }}
                    aria-expanded={advancedOpen}
                    aria-label={
                      advancedOpen
                        ? "Hide advanced sort options"
                        : "Show advanced sort options"
                    }
                  >
                    {advancedOpen ? "Hide" : "More"}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        advancedOpen && "rotate-180"
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

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-9"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Row 4: Rating filters (min rating + unrated only) */}
      <div className="gap-lg flex flex-col md:flex-row md:flex-wrap md:items-center">
        <div className="gap-sm flex items-center">
          <Label className="text-sm font-medium">Minimum rating</Label>
          <RatingInput
            value={minRatingValue}
            readOnly={false}
            onChange={handleMinRatingChange}
            size="sm"
            aria-label="Minimum rating filter"
          />
          {minRatingValue !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearMinRating}
              className="h-9"
              aria-label="Clear minimum rating"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        <div className="gap-sm flex items-center">
          <Switch
            id="unrated-only"
            checked={unratedOnly}
            onCheckedChange={handleUnratedOnlyChange}
            aria-label="Show only unrated games"
          />
          <Label htmlFor="unrated-only" className="text-sm font-medium">
            Unrated only
          </Label>
        </div>
      </div>

      {/* Row 3 mobile: collapsible platform + sort */}
      <div className="space-y-sm md:hidden">
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              aria-expanded={filtersOpen}
              aria-label={filtersOpen ? "Hide filters" : "Show filters"}
            >
              <span>
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  filtersOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-md pt-md">
            <PlatformFilterCombobox
              value={searchParams.get("platform") ?? "__all__"}
              onValueChange={(value) =>
                updateFilter(
                  "platform",
                  value === "__all__" ? undefined : value
                )
              }
              platforms={platforms}
              isLoading={isLoadingPlatforms}
            />
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

                <Collapsible open={advancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-sm hover:bg-accent w-full justify-start px-2 py-1.5 text-sm font-normal"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowAdvancedSort(!showAdvancedSort);
                      }}
                      aria-expanded={advancedOpen}
                      aria-label={
                        advancedOpen
                          ? "Hide advanced sort options"
                          : "Show advanced sort options"
                      }
                    >
                      {advancedOpen ? "Hide" : "More"}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          advancedOpen && "rotate-180"
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
          </CollapsibleContent>
        </Collapsible>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-9 w-full"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="ml-md">Clear filters</span>
          </Button>
        )}
      </div>
    </div>
  );
}
