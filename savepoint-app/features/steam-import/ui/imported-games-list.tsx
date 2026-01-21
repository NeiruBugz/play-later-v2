"use client";

import type { ImportedGame } from "@prisma/client";
import { ChevronLeft, ChevronRight, Gamepad2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

import { ImportedGameCard } from "./imported-game-card";

export type FilterValues = {
  playtimeStatus?: "all" | "played" | "never_played";
  playtimeRange?: "all" | "under_1h" | "1_to_10h" | "10_to_50h" | "over_50h";
  platform?: "all" | "windows" | "mac" | "linux";
  lastPlayed?: "all" | "30_days" | "1_year" | "over_1_year" | "never";
};

export type SortBy =
  | "name_asc"
  | "name_desc"
  | "playtime_desc"
  | "playtime_asc"
  | "last_played_desc"
  | "last_played_asc"
  | "added_desc";

type ImportedGamesListProps = {
  games: ImportedGame[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  error?: Error | null;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  playtimeStatus?: "all" | "played" | "never_played";
  playtimeRange?: "all" | "under_1h" | "1_to_10h" | "10_to_50h" | "over_50h";
  platform?: "all" | "windows" | "mac" | "linux";
  lastPlayed?: "all" | "30_days" | "1_year" | "over_1_year" | "never";
  sortBy?: SortBy;
  onFilterChange?: (filters: FilterValues) => void;
  onSortChange?: (sortBy: SortBy) => void;
};

type ActiveFilter = {
  key: keyof FilterValues;
  label: string;
  value: string;
};

function getFilterLabel(key: keyof FilterValues, value: string): string {
  switch (key) {
    case "playtimeStatus":
      if (value === "played") return "Played";
      if (value === "never_played") return "Never Played";
      return "All Playtime Status";

    case "playtimeRange":
      if (value === "under_1h") return "Under 1 hour";
      if (value === "1_to_10h") return "1-10 hours";
      if (value === "10_to_50h") return "10-50 hours";
      if (value === "over_50h") return "Over 50 hours";
      return "All Playtime Ranges";

    case "platform":
      if (value === "windows") return "Windows";
      if (value === "mac") return "Mac";
      if (value === "linux") return "Linux";
      return "All Platforms";

    case "lastPlayed":
      if (value === "30_days") return "Last 30 days";
      if (value === "1_year") return "Last year";
      if (value === "over_1_year") return "Over a year ago";
      if (value === "never") return "Never";
      return "All Time";

    default:
      return value;
  }
}

function getActiveFilters(filters: {
  search?: string;
  playtimeStatus?: string;
  playtimeRange?: string;
  platform?: string;
  lastPlayed?: string;
}): (ActiveFilter | { key: "search"; label: string; value: string })[] {
  const active: (
    | ActiveFilter
    | { key: "search"; label: string; value: string }
  )[] = [];

  if (filters.search) {
    active.push({
      key: "search",
      label: `Search: ${filters.search}`,
      value: filters.search,
    });
  }

  if (filters.playtimeStatus && filters.playtimeStatus !== "all") {
    active.push({
      key: "playtimeStatus",
      label: getFilterLabel("playtimeStatus", filters.playtimeStatus),
      value: filters.playtimeStatus,
    });
  }

  if (filters.playtimeRange && filters.playtimeRange !== "all") {
    active.push({
      key: "playtimeRange",
      label: getFilterLabel("playtimeRange", filters.playtimeRange),
      value: filters.playtimeRange,
    });
  }

  if (filters.platform && filters.platform !== "all") {
    active.push({
      key: "platform",
      label: getFilterLabel("platform", filters.platform),
      value: filters.platform,
    });
  }

  if (filters.lastPlayed && filters.lastPlayed !== "all") {
    active.push({
      key: "lastPlayed",
      label: getFilterLabel("lastPlayed", filters.lastPlayed),
      value: filters.lastPlayed,
    });
  }

  return active;
}

function LoadingSkeleton({ pageSize }: { pageSize: number }) {
  return (
    <div className="space-y-lg">
      <Skeleton variant="text" className="h-8 w-64" />
      <div className="space-y-xs">
        {Array.from({ length: pageSize }).map((_, index) => (
          <Skeleton key={index} variant="card" className="h-20" />
        ))}
      </div>
      <div className="gap-md flex items-center justify-center">
        <Skeleton variant="button" />
        <Skeleton variant="text" className="h-5 w-24" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="px-lg py-5xl flex flex-col items-center justify-center text-center">
      <div className="text-destructive mb-xl text-5xl">⚠</div>
      <h2 className="heading-lg mb-md">Failed to Load Games</h2>
      <p className="body-md text-muted-foreground mb-xl max-w-md">
        {error.message ||
          "An error occurred while loading your imported games. Please try again."}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Retry
        </Button>
      )}
    </div>
  );
}

function FilterChips({
  activeFilters,
  onRemoveFilter,
  onClearAll,
}: {
  activeFilters: (
    | ActiveFilter
    | { key: "search"; label: string; value: string }
  )[];
  onRemoveFilter: (key: keyof FilterValues | "search") => void;
  onClearAll: () => void;
}) {
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="gap-sm flex flex-wrap items-center">
      {activeFilters.map((filter) => (
        <Badge
          key={`${filter.key}-${filter.value}`}
          variant="outline"
          className="gap-xs flex items-center"
        >
          <span>{filter.label}</span>
          <button
            onClick={() => onRemoveFilter(filter.key)}
            className="hover:text-foreground ml-1 rounded-sm"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-auto p-1 text-xs"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isDisabled,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isDisabled?: boolean;
}) {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div
      className="gap-md flex items-center justify-center"
      role="navigation"
      aria-label="Pagination"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage || isDisabled}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <span className="text-muted-foreground text-sm" aria-live="polite">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage || isDisabled}
        aria-label="Go to next page"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ImportedGamesList({
  games,
  totalCount,
  currentPage,
  pageSize,
  isLoading = false,
  error = null,
  onPageChange,
  onRetry,
  search = "",
  onSearchChange,
  playtimeStatus = "all",
  playtimeRange = "all",
  platform = "all",
  lastPlayed = "all",
  sortBy = "added_desc",
  onFilterChange,
  onSortChange,
}: ImportedGamesListProps) {
  const [inputValue, setInputValue] = useState(search);
  const debouncedSearch = useDebouncedValue(inputValue, 300);

  useEffect(() => {
    if (onSearchChange && debouncedSearch !== search) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange, search]);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleClearSearch = () => {
    setInputValue("");
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    if (onFilterChange) {
      onFilterChange({
        playtimeStatus,
        playtimeRange,
        platform,
        lastPlayed,
        [key]: value,
      });
    }
  };

  const handleRemoveFilter = (key: keyof FilterValues | "search") => {
    if (key === "search") {
      handleClearSearch();
    } else if (onFilterChange) {
      onFilterChange({
        playtimeStatus,
        playtimeRange,
        platform,
        lastPlayed,
        [key]: "all",
      });
    }
  };

  const handleClearAllFilters = () => {
    handleClearSearch();
    if (onFilterChange) {
      onFilterChange({
        playtimeStatus: "all",
        playtimeRange: "all",
        platform: "all",
        lastPlayed: "all",
      });
    }
  };

  const activeFilters = getActiveFilters({
    search,
    playtimeStatus,
    playtimeRange,
    platform,
    lastPlayed,
  });

  if (isLoading) {
    return <LoadingSkeleton pageSize={pageSize} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  const hasActiveFiltersExcludingSearch =
    activeFilters.filter((f) => f.key !== "search").length > 0;
  const hasNoGamesAtAll =
    totalCount === 0 && !search && !hasActiveFiltersExcludingSearch;
  const hasNoSearchResults =
    totalCount === 0 && search && !hasActiveFiltersExcludingSearch;
  const hasNoFilterResults =
    totalCount === 0 && hasActiveFiltersExcludingSearch && !search;

  if (hasNoGamesAtAll) {
    return (
      <EmptyState
        icon={Gamepad2}
        title="No games imported yet"
        description="Import your Steam library to see your games here. Connect your Steam account to get started."
        spacing="spacious"
      />
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-lg">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search games..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="pr-9 pl-9"
          aria-label="Search imported games"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Sort and Filter Controls */}
      <div className="space-y-md">
        {/* Sort Selector */}
        <div className="space-y-xs">
          <Label
            htmlFor="sort-selector"
            className="text-muted-foreground text-xs"
          >
            Sort by
          </Label>
          <Select
            value={sortBy}
            onValueChange={(value) => onSortChange?.(value as SortBy)}
          >
            <SelectTrigger id="sort-selector" aria-label="Sort games">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="added_desc">Recently Added</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="playtime_desc">
                Playtime (High to Low)
              </SelectItem>
              <SelectItem value="playtime_asc">
                Playtime (Low to High)
              </SelectItem>
              <SelectItem value="last_played_desc">
                Last Played (Recent)
              </SelectItem>
              <SelectItem value="last_played_asc">
                Last Played (Oldest)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Dropdowns */}
        <div className="gap-md grid grid-cols-2 md:grid-cols-4">
          {/* Playtime Status Filter */}
          <div className="space-y-xs">
            <Label
              htmlFor="playtime-status-filter"
              className="text-muted-foreground text-xs"
            >
              Playtime Status
            </Label>
            <Select
              value={playtimeStatus}
              onValueChange={(value) =>
                handleFilterChange("playtimeStatus", value)
              }
            >
              <SelectTrigger
                id="playtime-status-filter"
                aria-label="Filter by playtime status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="played">Played</SelectItem>
                <SelectItem value="never_played">Never Played</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Playtime Range Filter */}
          <div className="space-y-xs">
            <Label
              htmlFor="playtime-range-filter"
              className="text-muted-foreground text-xs"
            >
              Playtime Range
            </Label>
            <Select
              value={playtimeRange}
              onValueChange={(value) =>
                handleFilterChange("playtimeRange", value)
              }
            >
              <SelectTrigger
                id="playtime-range-filter"
                aria-label="Filter by playtime range"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="under_1h">Under 1 hour</SelectItem>
                <SelectItem value="1_to_10h">1-10 hours</SelectItem>
                <SelectItem value="10_to_50h">10-50 hours</SelectItem>
                <SelectItem value="over_50h">50+ hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Platform Filter */}
          <div className="space-y-xs">
            <Label
              htmlFor="platform-filter"
              className="text-muted-foreground text-xs"
            >
              Platform
            </Label>
            <Select
              value={platform}
              onValueChange={(value) => handleFilterChange("platform", value)}
            >
              <SelectTrigger
                id="platform-filter"
                aria-label="Filter by platform"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="windows">Windows</SelectItem>
                <SelectItem value="mac">Mac</SelectItem>
                <SelectItem value="linux">Linux</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Last Played Filter */}
          <div className="space-y-xs">
            <Label
              htmlFor="last-played-filter"
              className="text-muted-foreground text-xs"
            >
              Last Played
            </Label>
            <Select
              value={lastPlayed}
              onValueChange={(value) => handleFilterChange("lastPlayed", value)}
            >
              <SelectTrigger
                id="last-played-filter"
                aria-label="Filter by last played date"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30_days">Last 30 days</SelectItem>
                <SelectItem value="1_year">Last year</SelectItem>
                <SelectItem value="over_1_year">Over a year ago</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      <FilterChips
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {hasNoSearchResults ? (
        <EmptyState
          icon={Search}
          title="No games found"
          description={`No games match "${search}". Try a different search term.`}
          spacing="compact"
        />
      ) : hasNoFilterResults ? (
        <EmptyState
          icon={Search}
          title="No games match your filters"
          description="Try adjusting your filter criteria to see more games."
          spacing="compact"
          action={{
            label: "Clear all filters",
            onClick: handleClearAllFilters,
            variant: "secondary",
          }}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="heading-lg">
              {totalCount} {totalCount === 1 ? "game" : "games"}
              {search && " found"}
            </h2>
          </div>

          <div className="space-y-xs" role="list" aria-label="Imported games">
            {games.map((game) => (
              <div key={game.id} role="listitem">
                <ImportedGameCard game={game} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
