"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  LIBRARY_STATUS_CONFIG,
  type StatusBadgeVariant,
} from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";

import { useOptimisticFilters } from "../hooks/use-optimistic-filters";
import { useStatusCounts } from "../hooks/use-status-counts";
import { useUniquePlatforms } from "../hooks/use-unique-platforms";
import { PlatformFilterCombobox } from "./platform-filter-combobox";

const PRIMARY_SORT_OPTIONS = [
  { value: "updatedAt-desc", label: "Recently Updated" },
  { value: "createdAt-desc", label: "Recently Added" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "rating-desc", label: "Highest Rated" },
  { value: "rating-asc", label: "Lowest Rated" },
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

function getCurrentSortValue(sortBy: string, sortOrder: string): string {
  if (sortBy === "rating-desc" || sortBy === "rating-asc") return sortBy;
  return `${sortBy}-${sortOrder}`;
}

export function LibraryFilterSidebar() {
  const searchParams = useSearchParams();
  const {
    filters,
    isPending,
    pendingField,
    setStatus,
    setPlatform,
    setSort,
    clearAll,
  } = useOptimisticFilters();

  const currentStatus = filters.status ?? "__all__";

  const { data: counts } = useStatusCounts({
    platform: filters.platform,
    search: filters.search,
  });
  const { data: platforms, isLoading: isLoadingPlatforms } =
    useUniquePlatforms();

  const handleSortChange = useCallback(
    (value: string) => {
      if (value === "rating-desc" || value === "rating-asc") {
        setSort(value as "rating-desc" | "rating-asc");
      } else {
        const dashIndex = value.lastIndexOf("-");
        const sortBy = value.slice(0, dashIndex) as Parameters<
          typeof setSort
        >[0];
        const sortOrder = value.slice(dashIndex + 1) as "asc" | "desc";
        setSort(sortBy, sortOrder);
      }
    },
    [setSort]
  );

  const totalCount = counts
    ? Object.values(counts).reduce((sum, n) => sum + n, 0)
    : 0;

  const hasClearableFilters =
    searchParams.get("status") ||
    searchParams.get("platform") ||
    searchParams.get("search") ||
    searchParams.get("minRating") ||
    searchParams.get("unratedOnly");

  const sortValue = getCurrentSortValue(filters.sortBy, filters.sortOrder);

  return (
    <aside
      className="hidden w-56 shrink-0 flex-col gap-6 pt-1 xl:flex"
      aria-label="Library filters"
    >
      <section>
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Status
        </p>
        <ul className="space-y-1" role="list">
          <li>
            <Button
              variant={currentStatus === "__all__" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatus(null)}
              aria-label="Show all statuses"
              aria-pressed={currentStatus === "__all__"}
              disabled={isPending && pendingField === "status"}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                {isPending &&
                  pendingField === "status" &&
                  currentStatus === "__all__" && (
                    <Loader2
                      className="h-3 w-3 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                All
              </span>
              <Badge variant="outline" className="text-xs tabular-nums">
                {totalCount}
              </Badge>
            </Button>
          </li>
          {LIBRARY_STATUS_CONFIG.map((config) => {
            const isActive = currentStatus === config.value;
            const count = counts?.[config.value] ?? 0;
            const statusStyles = getStatusFilterStyles(config.badgeVariant);
            const Icon = config.icon;
            const isThisButtonPending = isPending && pendingField === "status";

            return (
              <li key={config.value}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatus(config.value)}
                  aria-label={`Filter by ${config.label}`}
                  aria-pressed={isActive}
                  disabled={isThisButtonPending}
                  className={cn(
                    "w-full justify-between transition-all",
                    count === 0 && "opacity-50",
                    isActive && statusStyles.active,
                    !isActive && statusStyles.inactive,
                    "border"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {isThisButtonPending && isActive ? (
                      <Loader2
                        className="h-3.5 w-3.5 shrink-0 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Icon
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {config.label}
                  </span>
                  <span className="text-xs tabular-nums">{count}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Platform
        </p>
        <PlatformFilterCombobox
          value={filters.platform ?? "__all__"}
          onValueChange={(value) =>
            setPlatform(value === "__all__" ? null : (value ?? null))
          }
          platforms={platforms}
          isLoading={isLoadingPlatforms}
          disabled={isPending && pendingField === "platform"}
        />
      </section>

      <section>
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Sort
        </p>
        <Select
          value={sortValue}
          onValueChange={handleSortChange}
          disabled={isPending && pendingField === "sort"}
        >
          <SelectTrigger aria-label="Sort by" className="h-9 w-full">
            {isPending && pendingField === "sort" ? (
              <span className="flex items-center gap-2">
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                <SelectValue placeholder="Sort by" />
              </span>
            ) : (
              <SelectValue placeholder="Sort by" />
            )}
          </SelectTrigger>
          <SelectContent>
            {PRIMARY_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {hasClearableFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          aria-label="Clear all filters"
          disabled={isPending}
          className="w-full"
        >
          {isPending && pendingField === "clear" ? (
            <Loader2
              className="mr-1 h-3.5 w-3.5 animate-spin"
              aria-hidden="true"
            />
          ) : null}
          Clear all filters
        </Button>
      )}
    </aside>
  );
}
