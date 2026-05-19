import {
  DEFAULT_PLATFORMS,
  useLibraryFiltersState,
  type LibrarySortBy,
  type LibrarySortOrder,
  type LibraryStatus,
  type LibraryStatusCounts,
} from "@/features/filter-library/lib";
import { Button } from "@/shared/ui/button";

import { PlatformSelect } from "../platform-select";
import { SortSelect } from "../sort-select";
import { StatusList } from "../status-list";

// Re-export types so existing callers that import from this module continue to compile.
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
   * Optional per-status counts to render as count badges next to each status row.
   * Tanstack search-param contract does not yet supply these (no `getStatusCounts`
   * server fn ported); the rail still renders without counts when undefined.
   */
  counts?: LibraryStatusCounts;
  /**
   * Optional platform allow-list. Falls back to a built-in canonical list when
   * undefined (matches savepoint-app's `PLATFORM_OPTIONS`).
   */
  platforms?: ReadonlyArray<string>;
  /**
   * Pass-through for the mobile filter bar's unrated-only toggle. Sidebar
   * does not render this control (deferred to S18A "More" disclosure parity)
   * but must preserve the value across navigations so picking a status here
   * does not clobber an active mobile-side toggle.
   */
  unratedOnly?: boolean;
};

export function LibraryFilters(props: LibraryFiltersProps) {
  const {
    status,
    platform,
    minRating,
    sortBy,
    sortOrder,
    counts,
    platforms = DEFAULT_PLATFORMS,
    unratedOnly,
  } = props;

  const {
    currentStatus,
    sortValue,
    platformValue,
    hasActiveFilters,
    onStatusPick,
    onStatusAll,
    onPlatformChange,
    onSortChange,
    onClearAll,
  } = useLibraryFiltersState({
    status,
    platform,
    minRating,
    unratedOnly,
    sortBy,
    sortOrder,
  });

  const totalCount = counts
    ? Object.values(counts).reduce<number>(
        (sum, n) => sum + (typeof n === "number" ? n : 0),
        0
      )
    : undefined;

  return (
    <aside
      className="hidden w-56 shrink-0 flex-col gap-6 pt-1 xl:flex"
      aria-label="Library filters"
    >
      <section>
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Status
        </p>
        <StatusList
          currentStatus={currentStatus}
          counts={counts}
          onPick={onStatusPick}
          variant="sidebar"
          onAll={onStatusAll}
          totalCount={totalCount}
        />
      </section>

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
