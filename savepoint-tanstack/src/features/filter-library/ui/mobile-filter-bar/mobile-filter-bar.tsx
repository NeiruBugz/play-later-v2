import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import {
  DEFAULT_PLATFORMS,
  STATUS_FILTER_ENTRIES,
  useLibraryFiltersState,
} from "@/features/filter-library/lib";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

import { NotOwnedOnlyToggle } from "../not-owned-only-toggle";
import { PlatformSelect } from "../platform-select";
import { RatingControls } from "../rating-controls";
import { SortSelect } from "../sort-select";
import type { MobileFilterBarProps } from "./mobile-filter-bar.type";

/**
 * Mobile counterpart to `LibraryFilters` — collapses the same Platform / Sort
 * sections into a bottom-anchored Sheet, plus the minimum-rating
 * `RatingInput` and the unrated-only `Switch` controls (parity with canonical
 * `MobileFilterBar`). Visible <xl, hidden ≥xl where the sidebar takes over.
 *
 * Divergences from canonical:
 * - No free-text "search" input (broader scope; deferred to S16 search route).
 * - No Steam-import shortcut (separate widget surface in tanstack — deferred).
 */
export function MobileFilterBar(props: MobileFilterBarProps) {
  const {
    status,
    platform,
    minRating,
    unratedOnly,
    notOwnedOnly,
    sortBy,
    sortOrder,
    platforms = DEFAULT_PLATFORMS,
  } = props;

  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    sortValue,
    platformValue,
    hasActiveFilters,
    activeFilterCount,
    onNotOwnedOnlyChange,
    onPlatformChange,
    onSortChange,
    onMinRatingChange,
    onClearMinRating,
    onUnratedOnlyChange,
    onClearAll,
  } = useLibraryFiltersState({
    status,
    platform,
    minRating,
    unratedOnly,
    notOwnedOnly,
    sortBy,
    sortOrder,
  });

  const activeStatusEntry = STATUS_FILTER_ENTRIES.find(
    (e) => e.value === status
  );

  return (
    <div className="mb-2 md:hidden" aria-label="Mobile library filters">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        {/* Single row: [Filters flex-1 with count badge] */}
        <div className="flex items-center gap-1">
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-start"
                aria-label="Open filters"
              />
            }
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="ml-1.5">Filters</span>
            {activeStatusEntry ? (
              <span className="text-muted-foreground ml-1.5 text-xs">
                · {activeStatusEntry.label}
              </span>
            ) : null}
            {activeFilterCount > 0 ? (
              <span
                aria-label={`${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`}
                className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 text-xs tabular-nums"
              >
                {activeFilterCount}
              </span>
            ) : null}
          </SheetTrigger>
        </div>
        <SheetContent side="bottom" className="space-y-3">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Refine your library by platform, sort, and rating.
            </SheetDescription>
          </SheetHeader>

          <section>
            <NotOwnedOnlyToggle
              id="mobile-not-owned-only"
              status={status}
              checked={notOwnedOnly === true}
              onChange={onNotOwnedOnlyChange}
            />
          </section>

          <section>
            <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase">
              Platform
            </p>
            <PlatformSelect
              value={platformValue}
              platforms={platforms}
              rawPlatform={platform}
              onChange={onPlatformChange}
            />
          </section>

          <section>
            <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase">
              Sort
            </p>
            <SortSelect value={sortValue} onChange={onSortChange} />
          </section>

          <RatingControls
            idPrefix="mobile"
            minRating={minRating}
            unratedOnly={unratedOnly}
            onMinRatingChange={onMinRatingChange}
            onClearMinRating={onClearMinRating}
            onUnratedOnlyChange={onUnratedOnlyChange}
          />

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onClearAll({ onAfterClear: () => setSheetOpen(false) })
              }
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
