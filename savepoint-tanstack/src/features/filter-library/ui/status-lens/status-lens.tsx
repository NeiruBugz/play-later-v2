import {
  STATUS_ENTRIES,
  useLibraryFiltersState,
  type LibraryAcquisition,
  type LibrarySortBy,
  type LibrarySortOrder,
  type LibraryStatus,
} from "@/features/filter-library/lib";
import { SegmentedControl } from "@/shared/ui/segmented-control";

import type { StatusLensProps } from "./status-lens.type";

/**
 * StatusLens — sticky segmented-control row for the library.
 *
 * Promotes status filtering out of the Filters sheet into an always-visible,
 * sticky pill row. One tap re-filters without opening any overlay (AC LIB-2).
 * The row stays pinned while scrolling (AC LIB-3 — `sticky` applied by the
 * parent layout; component is scroll-aware-neutral).
 *
 * Uses `SegmentedControl` with `scrollable` so the row stays compact on
 * narrow phones while widening naturally on desktop (AC LIB-6).
 *
 * FSD: lives in `features/filter-library/ui/` — a user-intent feature
 * (filtering is a user action, not a domain entity).
 */
export function StatusLens({
  status,
  counts,
  platform,
  acquisition,
  startedOnly,
  minRating,
  unratedOnly,
  sortBy,
  sortOrder,
}: StatusLensProps) {
  // StatusLensProps widens status/acquisition to `string | undefined` so callers
  // don't need to assert to the narrower unions. Cast back here before the hook.
  const { onStatusPick, onStatusAll } = useLibraryFiltersState({
    status: status as LibraryStatus | undefined,
    platform,
    acquisition: acquisition as LibraryAcquisition | undefined,
    startedOnly,
    minRating,
    unratedOnly,
    sortBy: sortBy as LibrarySortBy,
    sortOrder: sortOrder as LibrarySortOrder,
  });

  const totalCount = counts
    ? Object.values(counts).reduce<number>(
        (sum, n) => sum + (typeof n === "number" ? n : 0),
        0
      )
    : undefined;

  const allOption = {
    value: "__all__" as const,
    label: (
      <>
        All
        {totalCount !== undefined ? (
          <span className="ml-1 text-xs tabular-nums opacity-70">
            {totalCount}
          </span>
        ) : null}
      </>
    ),
    ariaLabel: totalCount !== undefined ? `All · ${totalCount}` : "All",
  };

  const statusOptions = STATUS_ENTRIES.map((entry) => {
    const count = counts?.[entry.value as LibraryStatus];
    return {
      value: entry.value,
      label: (
        <>
          {entry.label}
          {count !== undefined ? (
            <span className="ml-1 text-xs tabular-nums opacity-70">
              {count}
            </span>
          ) : null}
        </>
      ),
      ariaLabel:
        count !== undefined ? `${entry.label} · ${count}` : entry.label,
    };
  });

  const options = [allOption, ...statusOptions] as Parameters<
    typeof SegmentedControl
  >[0]["options"];

  const currentValue = status ?? "__all__";

  const handleValueChange = (next: string) => {
    if (next === "__all__") {
      onStatusAll();
    } else {
      onStatusPick(next as LibraryStatus);
    }
  };

  return (
    <SegmentedControl
      value={currentValue}
      onValueChange={handleValueChange}
      options={options}
      size="sm"
      scrollable
      ariaLabel="Filter by status"
    />
  );
}
