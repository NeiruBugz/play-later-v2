import { useNavigate } from "@tanstack/react-router";
import {
  Archive,
  Bookmark,
  CheckCircle,
  Gamepad2,
  Star,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type LibraryStatus =
  | "PLAYING"
  | "PLAYED"
  | "UP_NEXT"
  | "SHELF"
  | "WISHLIST";

export type LibrarySortBy = "updatedAt" | "createdAt" | "title";
export type LibrarySortOrder = "asc" | "desc";

export type LibraryStatusCounts = Partial<Record<LibraryStatus, number>>;

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
};

// ---------------------------------------------------------------------------
// Status config — local to this slice. Mirrors canonical's LIBRARY_STATUS_CONFIG
// shape (label, icon, badgeVariant) but typed against the tanstack search-param
// `LibraryStatus` union rather than the Prisma enum.
// ---------------------------------------------------------------------------

type StatusBadgeVariant = "wishlist" | "shelf" | "upNext" | "playing" | "played";

type StatusEntry = {
  value: LibraryStatus;
  label: string;
  badgeVariant: StatusBadgeVariant;
  icon: LucideIcon;
};

const STATUS_ENTRIES: ReadonlyArray<StatusEntry> = [
  { value: "UP_NEXT", label: "Up Next", badgeVariant: "upNext", icon: Star },
  { value: "PLAYING", label: "Playing", badgeVariant: "playing", icon: Gamepad2 },
  { value: "SHELF", label: "Shelf", badgeVariant: "shelf", icon: Archive },
  { value: "PLAYED", label: "Played", badgeVariant: "played", icon: CheckCircle },
  {
    value: "WISHLIST",
    label: "Wishlist",
    badgeVariant: "wishlist",
    icon: Bookmark,
  },
];

const STATUS_FILTER_STYLES: Record<
  StatusBadgeVariant,
  { active: string; inactive: string }
> = {
  playing: {
    active:
      "bg-[var(--status-playing)] text-[var(--status-playing-foreground)] hover:bg-[var(--status-playing)]/90 border-transparent",
    inactive:
      "border-[var(--status-playing)]/30 text-[var(--status-playing)] hover:bg-[var(--status-playing)]/10",
  },
  played: {
    active:
      "bg-[var(--status-played)] text-[var(--status-played-foreground)] hover:bg-[var(--status-played)]/90 border-transparent",
    inactive:
      "border-[var(--status-played)]/30 text-[var(--status-played)] hover:bg-[var(--status-played)]/10",
  },
  shelf: {
    active:
      "bg-[var(--status-shelf)] text-[var(--status-shelf-foreground)] hover:bg-[var(--status-shelf)]/90 border-transparent",
    inactive:
      "border-[var(--status-shelf)]/30 text-[var(--status-shelf)] hover:bg-[var(--status-shelf)]/10",
  },
  upNext: {
    active:
      "bg-[var(--status-upNext)] text-[var(--status-upNext-foreground)] hover:bg-[var(--status-upNext)]/90 border-transparent",
    inactive:
      "border-[var(--status-upNext)]/30 text-[var(--status-upNext)] hover:bg-[var(--status-upNext)]/10",
  },
  wishlist: {
    active:
      "bg-[var(--status-wishlist)] text-[var(--status-wishlist-foreground)] hover:bg-[var(--status-wishlist)]/90 border-transparent",
    inactive:
      "border-[var(--status-wishlist)]/30 text-[var(--status-wishlist)] hover:bg-[var(--status-wishlist)]/10",
  },
};

// ---------------------------------------------------------------------------
// Sort config — single combined `Select` (matches canonical). Tanstack's loader
// schema accepts only sortBy ∈ {updatedAt, createdAt, title}, so the option set
// is narrower than canonical's. Documented as a divergence in the slice notes.
// ---------------------------------------------------------------------------

type SortOption = {
  value: string;
  label: string;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
};

const SORT_OPTIONS: ReadonlyArray<SortOption> = [
  {
    value: "updatedAt-desc",
    label: "Recently Updated",
    sortBy: "updatedAt",
    sortOrder: "desc",
  },
  {
    value: "createdAt-desc",
    label: "Recently Added",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  {
    value: "title-asc",
    label: "Title A–Z",
    sortBy: "title",
    sortOrder: "asc",
  },
  {
    value: "title-desc",
    label: "Title Z–A",
    sortBy: "title",
    sortOrder: "desc",
  },
];

const DEFAULT_PLATFORMS: ReadonlyArray<string> = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
];

const SORT_VALUE_MAP = new Map(SORT_OPTIONS.map((opt) => [opt.value, opt]));

function getSortValue(sortBy: LibrarySortBy, sortOrder: LibrarySortOrder): string {
  return `${sortBy}-${sortOrder}`;
}

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
    status !== undefined || platform !== undefined || minRating !== undefined;

  const updateSearch = (
    patch: Partial<{
      status: LibraryStatus | undefined;
      platform: string | undefined;
      minRating: number | undefined;
      sortBy: LibrarySortBy;
      sortOrder: LibrarySortOrder;
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
              variant={currentStatus === "__all__" ? "secondary" : "ghost"}
              size="sm"
              onClick={onStatusAll}
              aria-label="Show all statuses"
              aria-pressed={currentStatus === "__all__"}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">All</span>
              {totalCount !== undefined ? (
                <Badge variant="outline" className="text-xs tabular-nums">
                  {totalCount}
                </Badge>
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
