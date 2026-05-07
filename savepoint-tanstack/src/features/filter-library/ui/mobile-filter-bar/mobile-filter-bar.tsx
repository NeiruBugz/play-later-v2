import { useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import {
  DEFAULT_PLATFORMS,
  getSortValue,
  SORT_OPTIONS,
  SORT_VALUE_MAP,
  STATUS_ENTRIES,
  type LibraryStatus,
} from "@/features/filter-library/lib";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { RatingInput } from "@/shared/ui/rating-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { Switch } from "@/shared/ui/switch";

import type { MobileFilterBarProps } from "./mobile-filter-bar.type";

/**
 * Mobile counterpart to `LibraryFilters` — collapses the same Status / Platform
 * / Sort sections into a bottom-anchored Sheet, plus the minimum-rating
 * `RatingInput` and the unrated-only `Switch` controls (parity with canonical
 * `MobileFilterBar`). Visible <xl, hidden ≥xl where the sidebar takes over.
 *
 * Divergences from canonical:
 * - No free-text "search" input (broader scope; deferred to S16 search route).
 * - No Steam-import shortcut (separate widget surface in tanstack — deferred).
 * - No status count badges (sidebar punted them; mobile bar matches).
 */
export function MobileFilterBar(props: MobileFilterBarProps) {
  const {
    status,
    platform,
    minRating,
    unratedOnly,
    sortBy,
    sortOrder,
    counts,
    platforms = DEFAULT_PLATFORMS,
  } = props;
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentStatus: LibraryStatus | "__all__" = status ?? "__all__";

  const updateSearch = (
    patch: Partial<{
      status: LibraryStatus | undefined;
      platform: string | undefined;
      minRating: number | undefined;
      unratedOnly: boolean | undefined;
      sortBy: typeof sortBy;
      sortOrder: typeof sortOrder;
    }>
  ) => {
    navigate({
      to: ".",
      search: {
        status,
        platform,
        minRating,
        unratedOnly,
        sortBy,
        sortOrder,
        ...patch,
      },
    });
  };

  const onStatusPick = (value: LibraryStatus) => {
    // Toggle-deselect to mirror sidebar + canonical behavior.
    updateSearch({ status: status === value ? undefined : value });
  };

  const onPlatformChange = (raw: string) => {
    updateSearch({ platform: raw === "__all__" ? undefined : raw });
  };

  const onSortChange = (raw: string) => {
    const opt = SORT_VALUE_MAP.get(raw);
    if (!opt) return;
    updateSearch({ sortBy: opt.sortBy, sortOrder: opt.sortOrder });
  };

  const onMinRatingChange = (next: number | null) => {
    updateSearch({ minRating: next === null ? undefined : next });
  };

  const onClearMinRating = () => updateSearch({ minRating: undefined });

  const onUnratedOnlyChange = (checked: boolean) => {
    updateSearch({ unratedOnly: checked ? true : undefined });
  };

  const onClearAll = () => {
    updateSearch({
      status: undefined,
      platform: undefined,
      minRating: undefined,
      unratedOnly: undefined,
      sortBy: "updatedAt",
      sortOrder: "desc",
    });
    setSheetOpen(false);
  };

  const sortValue = getSortValue(sortBy, sortOrder);
  const platformValue = platform ?? "__all__";

  const activeStatusEntry = STATUS_ENTRIES.find((e) => e.value === status);
  const activeFilterCount =
    (status !== undefined ? 1 : 0) +
    (platform !== undefined ? 1 : 0) +
    (minRating !== undefined ? 1 : 0) +
    (unratedOnly === true ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="mb-md xl:hidden" aria-label="Mobile library filters">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="ml-1.5">Filters</span>
            {activeStatusEntry ? (
              <span className="text-muted-foreground ml-1.5 text-xs">
                · {activeStatusEntry.label}
              </span>
            ) : null}
            {activeFilterCount > 0 ? (
              <span className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 text-xs tabular-nums">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="space-y-lg">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Refine your library by status, platform, sort, and rating.
            </SheetDescription>
          </SheetHeader>

          {/* Status section */}
          <section>
            <p className="text-muted-foreground mb-sm text-xs font-semibold tracking-wider uppercase">
              Status
            </p>
            <ul className="space-y-1" role="list">
              {STATUS_ENTRIES.map((entry) => {
                const isActive = currentStatus === entry.value;
                const count = counts?.[entry.value];
                const Icon = entry.icon;
                return (
                  <li key={entry.value}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusPick(entry.value)}
                      aria-label={
                        isActive
                          ? `Clear ${entry.label} filter`
                          : `Filter by ${entry.label}`
                      }
                      aria-pressed={isActive}
                      className={cn(
                        "w-full justify-between border",
                        count === 0 && "opacity-50",
                        isActive && "bg-secondary"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {entry.label}
                      </span>
                      {count !== undefined ? (
                        <span className="text-xs tabular-nums">{count}</span>
                      ) : null}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Platform section */}
          <section>
            <p className="text-muted-foreground mb-sm text-xs font-semibold tracking-wider uppercase">
              Platform
            </p>
            <Select value={platformValue} onValueChange={onPlatformChange}>
              <SelectTrigger
                aria-label="Platform"
                className="h-9 w-full"
              >
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All platforms</SelectItem>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
                {platform !== undefined && !platforms.includes(platform) ? (
                  <SelectItem value={platform}>{platform}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </section>

          {/* Sort section */}
          <section>
            <p className="text-muted-foreground mb-sm text-xs font-semibold tracking-wider uppercase">
              Sort
            </p>
            <Select value={sortValue} onValueChange={onSortChange}>
              <SelectTrigger aria-label="Sort" className="h-9 w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {/* Rating section */}
          <section className="space-y-sm">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Rating
            </p>
            <div className="gap-sm flex items-center">
              <Label className="text-sm font-medium">Minimum rating</Label>
              <RatingInput
                value={minRating ?? null}
                readOnly={false}
                onChange={onMinRatingChange}
                size="sm"
                aria-label="Minimum rating filter"
              />
              {minRating !== undefined ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearMinRating}
                  className="h-7"
                  aria-label="Clear minimum rating"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
            <div className="gap-sm flex items-center">
              <Switch
                id="mobile-unrated-only"
                checked={unratedOnly === true}
                onCheckedChange={onUnratedOnlyChange}
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

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearAll}
              aria-label="Clear all filters"
              className="w-full"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="ml-1">Clear all filters</span>
            </Button>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
