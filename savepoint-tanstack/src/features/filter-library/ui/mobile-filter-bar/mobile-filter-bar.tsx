import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import {
  DEFAULT_PLATFORMS,
  STATUS_ENTRIES,
  useLibraryFiltersState,
  type LibraryStatus,
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

import { AcquisitionList } from "../acquisition-list";
import { PlatformSelect } from "../platform-select";
import { RatingControls } from "../rating-controls";
import { SortSelect } from "../sort-select";
import { StartedOnlyToggle } from "../started-only-toggle";
import { StatusList } from "../status-list";
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
    acquisition,
    startedOnly,
    minRating,
    unratedOnly,
    sortBy,
    sortOrder,
    counts,
    platforms = DEFAULT_PLATFORMS,
  } = props;

  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    currentStatus,
    currentAcquisition,
    startedOnly: startedOnlyChecked,
    sortValue,
    platformValue,
    hasActiveFilters,
    activeFilterCount,
    onStatusPick,
    onAcquisitionPick,
    onStartedOnlyChange,
    onPlatformChange,
    onSortChange,
    onMinRatingChange,
    onClearMinRating,
    onUnratedOnlyChange,
    onClearAll,
  } = useLibraryFiltersState({
    status,
    platform,
    acquisition,
    startedOnly,
    minRating,
    unratedOnly,
    sortBy,
    sortOrder,
  });

  const activeStatusEntry = STATUS_ENTRIES.find(
    (e) => e.value === (status as LibraryStatus | undefined)
  );

  return (
    <div className="mb-md md:hidden" aria-label="Mobile library filters">
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

          <section>
            <p className="text-muted-foreground mb-sm text-xs font-semibold tracking-wider uppercase">
              Status
            </p>
            <StatusList
              currentStatus={currentStatus}
              counts={counts}
              onPick={onStatusPick}
              variant="sheet"
            />
          </section>

          <section>
            <p className="text-muted-foreground mb-sm text-xs font-semibold tracking-wider uppercase">
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
            <p className="text-muted-foreground mb-sm text-xs font-semibold tracking-wider uppercase">
              Acquisition
            </p>
            <AcquisitionList
              current={currentAcquisition}
              onPick={onAcquisitionPick}
              variant="sheet"
            />
          </section>

          <section>
            <StartedOnlyToggle
              id="mobile-started-only"
              checked={startedOnlyChecked}
              onCheckedChange={onStartedOnlyChange}
            />
          </section>

          <section>
            <p className="text-muted-foreground mb-sm text-xs font-semibold tracking-wider uppercase">
              Sort
            </p>
            <SortSelect value={sortValue} onChange={onSortChange} />
          </section>

          <RatingControls
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
