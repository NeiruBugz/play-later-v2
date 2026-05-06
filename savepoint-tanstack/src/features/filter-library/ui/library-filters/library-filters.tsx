import { useNavigate } from "@tanstack/react-router";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export type LibraryStatus =
  | "PLAYING"
  | "PLAYED"
  | "UP_NEXT"
  | "SHELF"
  | "WISHLIST";

export type LibrarySortBy = "updatedAt" | "createdAt" | "title";
export type LibrarySortOrder = "asc" | "desc";

export type LibraryFiltersProps = {
  status: LibraryStatus | undefined;
  platform: string | undefined;
  minRating: number | undefined;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
};

const STATUS_OPTIONS: ReadonlyArray<{ value: LibraryStatus; label: string }> = [
  { value: "PLAYING", label: "Playing" },
  { value: "PLAYED", label: "Played" },
  { value: "UP_NEXT", label: "Up Next" },
  { value: "SHELF", label: "Shelf" },
  { value: "WISHLIST", label: "Wishlist" },
];

const PLATFORM_OPTIONS: ReadonlyArray<string> = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
];

const RATING_OPTIONS: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const SORT_BY_OPTIONS: ReadonlyArray<{ value: LibrarySortBy; label: string }> =
  [
    { value: "updatedAt", label: "Recently updated" },
    { value: "createdAt", label: "Recently added" },
    { value: "title", label: "Title" },
  ];

const SORT_ORDER_OPTIONS: ReadonlyArray<{
  value: LibrarySortOrder;
  label: string;
}> = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

const selectClasses =
  "h-10 rounded-lg border border-border bg-card px-md text-sm text-foreground shadow-paper-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function LibraryFilters(props: LibraryFiltersProps) {
  const { status, platform, minRating, sortBy, sortOrder } = props;
  const navigate = useNavigate();

  const hasActiveFilter =
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

  const onStatusClick = (value: LibraryStatus) => {
    // Toggle-deselect: clicking the active status clears it.
    updateSearch({ status: status === value ? undefined : value });
  };

  const onPlatformChange = (raw: string) => {
    updateSearch({ platform: raw === "" ? undefined : raw });
  };

  const onMinRatingChange = (raw: string) => {
    updateSearch({ minRating: raw === "" ? undefined : Number(raw) });
  };

  const onSortByChange = (raw: string) => {
    updateSearch({ sortBy: raw as LibrarySortBy });
  };

  const onSortOrderChange = (raw: string) => {
    updateSearch({ sortOrder: raw as LibrarySortOrder });
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

  return (
    <div className="gap-lg flex flex-col">
      <div className="gap-sm flex flex-wrap">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value;
          return (
            <Button
              key={opt.value}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              aria-label={`Filter by ${opt.label}`}
              aria-pressed={active}
              onClick={() => onStatusClick(opt.value)}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>

      <div className="gap-md flex flex-wrap">
        <select
          aria-label="Platform"
          className={cn(selectClasses)}
          value={platform ?? ""}
          onChange={(event) => onPlatformChange(event.target.value)}
        >
          <option value="">All platforms</option>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          {platform !== undefined && !PLATFORM_OPTIONS.includes(platform) ? (
            <option value={platform}>{platform}</option>
          ) : null}
        </select>

        <select
          aria-label="Min rating"
          className={cn(selectClasses)}
          value={minRating === undefined ? "" : String(minRating)}
          onChange={(event) => onMinRatingChange(event.target.value)}
        >
          <option value="">Any rating</option>
          {RATING_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          aria-label="Sort by"
          className={cn(selectClasses)}
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value)}
        >
          {SORT_BY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Sort order"
          className={cn(selectClasses)}
          value={sortOrder}
          onChange={(event) => onSortOrderChange(event.target.value)}
        >
          {SORT_ORDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilter ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Clear all filters"
            onClick={onClearAll}
          >
            Clear all
          </Button>
        ) : null}
      </div>
    </div>
  );
}
