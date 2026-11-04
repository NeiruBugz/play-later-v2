import {
  DEFAULT_PLATFORMS,
  useLibraryFiltersState,
  type LibrarySortBy,
  type LibrarySortOrder,
  type LibraryStatus,
  type LibraryStatusCounts,
} from "@/features/filter-library/lib";
import { Button } from "@/shared/ui/button";

import { NotOwnedOnlyToggle } from "../not-owned-only-toggle";
import { PlatformSelect } from "../platform-select";
import { RatingControls } from "../rating-controls";
import { SortSelect } from "../sort-select";

export type {
  LibraryStatus,
  LibrarySortBy,
  LibrarySortOrder,
  LibraryStatusCounts,
};

export type LibraryFiltersProps = {
  status: LibraryStatus | undefined;
  platform: string | undefined;
  minRating: number | undefined;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
  /**
   * Optional platform allow-list. Falls back to a built-in canonical list when
   * undefined (matches savepoint-app's `PLATFORM_OPTIONS`).
   */
  platforms?: ReadonlyArray<string>;
  /**
   * Drives the "Unrated only" switch, shared with the mobile filter bar via
   * `RatingControls` and `useLibraryFiltersState`.
   */
  unratedOnly?: boolean;
  notOwnedOnly?: boolean;
};

export function LibraryFilters(props: LibraryFiltersProps) {
  const {
    status,
    platform,
    minRating,
    sortBy,
    sortOrder,
    platforms = DEFAULT_PLATFORMS,
    unratedOnly,
    notOwnedOnly,
  } = props;

  const {
    sortValue,
    platformValue,
    hasActiveFilters,
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

  return (
    <aside
      className="hidden w-56 shrink-0 flex-col gap-6 pt-1 md:flex"
      aria-label="Library filters"
    >
      {status === "WANT" ? (
        <section>
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Ownership
          </p>
          <NotOwnedOnlyToggle
            id="sidebar-not-owned-only"
            status={status}
            checked={notOwnedOnly === true}
            onChange={onNotOwnedOnlyChange}
          />
        </section>
      ) : null}

      <section>
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Platform
        </p>
        <PlatformSelect
          value={platformValue}
          platforms={platforms}
          rawPlatform={platform}
          onChange={onPlatformChange}
        />
      </section>

      <RatingControls
        idPrefix="sidebar"
        minRating={minRating}
        unratedOnly={unratedOnly}
        onMinRatingChange={onMinRatingChange}
        onClearMinRating={onClearMinRating}
        onUnratedOnlyChange={onUnratedOnlyChange}
      />

      <section>
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Sort
        </p>
        <SortSelect value={sortValue} onChange={onSortChange} />
      </section>

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Clear all filters"
          onClick={() => onClearAll()}
          className="w-full"
        >
          Clear all filters
        </Button>
      ) : null}
    </aside>
  );
}
