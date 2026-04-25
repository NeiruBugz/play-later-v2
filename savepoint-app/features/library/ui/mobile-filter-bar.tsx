"use client";

import { Download, Loader2, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { RatingInput } from "@/shared/components/ui/rating-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { Switch } from "@/shared/components/ui/switch";
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";

import { useOptimisticFilters } from "../hooks/use-optimistic-filters";
import { useStatusCounts } from "../hooks/use-status-counts";
import { useUniquePlatforms } from "../hooks/use-unique-platforms";
import { PlatformFilterCombobox } from "./platform-filter-combobox";

const SORT_OPTIONS = [
  { value: "updatedAt-desc", label: "Recently Updated" },
  { value: "createdAt-desc", label: "Recently Added" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
  { value: "rating-desc", label: "Highest rated" },
  { value: "rating-asc", label: "Lowest rated" },
  { value: "releaseDate-desc", label: "Release Date (Newest)" },
  { value: "releaseDate-asc", label: "Release Date (Oldest)" },
  { value: "startedAt-desc", label: "Started Date" },
  { value: "completedAt-desc", label: "Completed Date" },
] as const;

interface MobileFilterBarProps {
  isSteamConnected?: boolean;
}

export function MobileFilterBar({
  isSteamConnected = false,
}: MobileFilterBarProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    filters,
    isPending,
    pendingField,
    setStatus,
    setPlatform,
    setSort,
    clearAll,
  } = useOptimisticFilters();

  const { data: counts } = useStatusCounts({
    platform: filters.platform,
    search: filters.search,
  });
  const { data: platforms, isLoading: isLoadingPlatforms } =
    useUniquePlatforms();

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

  const currentStatus = filters.status ?? "__all__";

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

  const handleClearAll = useCallback(() => {
    clearAll();
    setSheetOpen(false);
  }, [clearAll]);

  const getCurrentSortValue = useCallback((): string => {
    const { sortBy, sortOrder } = filters;
    if (sortBy === "rating-desc" || sortBy === "rating-asc") return sortBy;
    return `${sortBy}-${sortOrder}`;
  }, [filters]);

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

  const hasActiveFilters = Boolean(
    searchParams.get("status") ||
    searchParams.get("platform") ||
    searchParams.get("search") ||
    searchParams.get("minRating") ||
    searchParams.get("unratedOnly")
  );

  const activeStatusLabel =
    currentStatus === "__all__"
      ? null
      : (LIBRARY_STATUS_CONFIG.find((c) => c.value === currentStatus)?.label ??
        null);

  const activeFilterCount = [
    activeStatusLabel,
    searchParams.get("platform"),
    minRatingValue !== null ? "1" : null,
    unratedOnly ? "1" : null,
  ].filter(Boolean).length;

  const isSortPending = isPending && pendingField === "sort";
  const isPlatformPending = isPending && pendingField === "platform";
  const isStatusPending = isPending && pendingField === "status";

  return (
    <div className="mb-xl space-y-md">
      <div className="gap-sm flex items-center">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-start sm:flex-initial"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span className="ml-1.5">Filters</span>
              {activeStatusLabel && (
                <span className="text-muted-foreground ml-1.5 text-xs">
                  · {activeStatusLabel}
                </span>
              )}
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 text-xs tabular-nums sm:ml-1.5">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="space-y-lg">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Refine your library by status, platform, sort, and rating.
              </SheetDescription>
            </SheetHeader>

            <section>
              <p className="text-muted-foreground mb-sm text-xs font-semibold tracking-wider uppercase">
                Status
              </p>
              <ul className="space-y-1" role="list">
                {LIBRARY_STATUS_CONFIG.map((config) => {
                  const isActive = currentStatus === config.value;
                  const count = counts?.[config.value] ?? 0;
                  const Icon = config.icon;
                  return (
                    <li key={config.value}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setStatus(isActive ? null : config.value)
                        }
                        aria-label={
                          isActive
                            ? `Clear ${config.label} filter`
                            : `Filter by ${config.label}`
                        }
                        aria-pressed={isActive}
                        disabled={isStatusPending}
                        className={cn(
                          "w-full justify-between border",
                          count === 0 && "opacity-50",
                          isActive && "bg-secondary"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {isStatusPending && isActive ? (
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
              <p className="text-muted-foreground mb-sm text-xs font-semibold tracking-wider uppercase">
                Platform
              </p>
              <PlatformFilterCombobox
                value={filters.platform ?? "__all__"}
                onValueChange={(value) =>
                  setPlatform(value === "__all__" ? null : (value ?? null))
                }
                platforms={platforms}
                isLoading={isLoadingPlatforms}
                disabled={isPlatformPending}
              />
            </section>

            <section>
              <p className="text-muted-foreground mb-sm text-xs font-semibold tracking-wider uppercase">
                Sort
              </p>
              <Select
                value={getCurrentSortValue()}
                onValueChange={handleSortChange}
                disabled={isSortPending}
              >
                <SelectTrigger aria-label="Sort by" className="h-9 w-full">
                  {isSortPending ? (
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
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section className="space-y-sm">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Rating
              </p>
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
                    className="h-7"
                    aria-label="Clear minimum rating"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Button>
                )}
              </div>
              <div className="gap-sm flex items-center">
                <Switch
                  id="mobile-unrated-only"
                  checked={unratedOnly}
                  onCheckedChange={handleUnratedOnlyChange}
                  aria-label="Show only unrated games"
                />
                <Label
                  htmlFor="mobile-unrated-only"
                  className="text-sm font-medium"
                >
                  Unrated only
                </Label>
              </div>
            </section>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                aria-label="Clear all filters"
                disabled={isPending}
                className="w-full"
              >
                {isPending && pendingField === "clear" ? (
                  <Loader2
                    className="mr-1 h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <X className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="ml-1">Clear all filters</span>
              </Button>
            )}
          </SheetContent>
        </Sheet>

        {isSteamConnected && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <Link href="/steam/games" aria-label="Import from Steam">
              <Download className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
