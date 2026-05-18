import { useNavigate } from "@tanstack/react-router";

import {
  DEFAULT_PLATFORMS,
  getSortValue,
  SORT_OPTIONS,
  SORT_VALUE_MAP,
  STATUS_ENTRIES,
  STATUS_FILTER_STYLES,
  type LibrarySortBy,
  type LibrarySortOrder,
  type LibraryStatus,
  type LibraryStatusCounts,
} from "@/features/filter-library/lib";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

// ---------------------------------------------------------------------------
// Re-export filter types from feature lib so existing callers keep importing
// `LibraryStatus`, `LibrarySortBy`, etc. from this module.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
  const navigate = useNavigate();

  const currentStatus: LibraryStatus | "__all__" = status ?? "__all__";

  const totalCount = counts
    ? Object.values(counts).reduce<number>(
        (sum, n) => sum + (typeof n === "number" ? n : 0),
        0
      )
    : undefined;

  const hasClearableFilters =
    status !== undefined ||
    platform !== undefined ||
    minRating !== undefined ||
    unratedOnly === true;

  const updateSearch = (
    patch: Partial<{
      status: LibraryStatus | undefined;
      platform: string | undefined;
      minRating: number | undefined;
      sortBy: LibrarySortBy;
      sortOrder: LibrarySortOrder;
      unratedOnly: boolean | undefined;
    }>
  ) => {
    navigate({
      to: ".",
      search: {
        status,
        platform,
        minRating,
        sortBy,
        sortOrder,
        unratedOnly,
        ...patch,
      },
    });
  };

  const onStatusAll = () => updateSearch({ status: undefined });
  const onStatusPick = (value: LibraryStatus) => {
    // Toggle-deselect to preserve canonical "click active to clear" behavior.
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

  const onClearAll = () => {
    updateSearch({
      status: undefined,
      platform: undefined,
      minRating: undefined,
      unratedOnly: undefined,
      sortBy: "updatedAt",
      sortOrder: "desc",
    });
  };

  const sortValue = getSortValue(sortBy, sortOrder);
  const platformValue = platform ?? "__all__";

  return (
    <aside
      className="hidden w-56 shrink-0 flex-col gap-6 pt-1 xl:flex"
      aria-label="Library filters"
    >
      {/* Status section */}
      <section>
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Status
        </p>
        <ul className="space-y-1" role="list">
          <li>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onStatusAll}
              aria-label="Show all statuses"
              aria-pressed={currentStatus === "__all__"}
              className={cn(
                "w-full justify-between border transition-all",
                currentStatus === "__all__"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent"
                  : "text-muted-foreground hover:bg-muted/50 border-transparent"
              )}
            >
              <span className="flex items-center gap-2">All</span>
              {totalCount !== undefined ? (
                <span className="text-xs tabular-nums">{totalCount}</span>
              ) : null}
            </Button>
          </li>
          {STATUS_ENTRIES.map((entry) => {
            const isActive = currentStatus === entry.value;
            const count = counts?.[entry.value];
            const styles = STATUS_FILTER_STYLES[entry.badgeVariant];
            const Icon = entry.icon;
            return (
              <li key={entry.value}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onStatusPick(entry.value)}
                  aria-label={`Filter by ${entry.label}`}
                  aria-pressed={isActive}
                  className={cn(
                    "w-full justify-between border transition-all",
                    count === 0 && "opacity-50",
                    isActive ? styles.active : styles.inactive
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Platform
        </p>
        <Select value={platformValue} onValueChange={onPlatformChange}>
          <SelectTrigger aria-label="Platform" className="h-9 w-full">
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
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
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

      {hasClearableFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Clear all filters"
          onClick={onClearAll}
          className="w-full"
        >
          Clear all filters
        </Button>
      ) : null}
    </aside>
  );
}
