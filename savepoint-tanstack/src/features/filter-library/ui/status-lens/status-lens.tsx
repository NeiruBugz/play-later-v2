import {
  STATUS_ENTRIES,
  useLibraryFiltersState,
  type LibraryAcquisition,
  type LibrarySortBy,
  type LibrarySortOrder,
  type LibraryStatus,
} from "@/features/filter-library/lib";
import { cn } from "@/shared/lib/utils";

import type { StatusLensProps } from "./status-lens.type";

type StatusChip = {
  value: string;
  label: string;
  count: number | undefined;
  /** Status token key for the colored dot; absent for the "All" chip. */
  dotVariant?: string;
};

/**
 * StatusLens — the library's primary status filter, surfaced as an
 * always-visible row of segmented PILL chips (not the Filters sheet). One tap
 * re-filters (AC LIB-2); the parent keeps the row sticky (AC LIB-3). Each
 * status chip carries a colored dot keyed to its status token, the active chip
 * fills with the accent. Horizontally scrollable so it stays compact on phones
 * and widens naturally on desktop (AC LIB-6).
 *
 * Keeps `role="tablist"`/`role="tab"` semantics (selection-driven filter).
 *
 * FSD: lives in `features/filter-library/ui/` — filtering is a user intent.
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

  const chips: StatusChip[] = [
    { value: "__all__", label: "All", count: totalCount },
    ...STATUS_ENTRIES.map((entry) => ({
      value: entry.value,
      label: entry.label,
      count: counts?.[entry.value as LibraryStatus],
      dotVariant: entry.badgeVariant,
    })),
  ];

  const currentValue = status ?? "__all__";

  const handlePick = (value: string) => {
    if (value === "__all__") {
      onStatusAll();
    } else {
      onStatusPick(value as LibraryStatus);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Filter by status"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((chip) => {
        const active = currentValue === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-state={active ? "active" : "inactive"}
            onClick={() => handlePick(chip.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-card text-foreground border-border hover:bg-muted"
            )}
          >
            {chip.dotVariant && !active ? (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: `var(--status-${chip.dotVariant})` }}
              />
            ) : null}
            {chip.label}
            {chip.count !== undefined ? (
              <span
                className={cn(
                  "tabular-nums",
                  active ? "opacity-80" : "text-muted-foreground"
                )}
              >
                {chip.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
