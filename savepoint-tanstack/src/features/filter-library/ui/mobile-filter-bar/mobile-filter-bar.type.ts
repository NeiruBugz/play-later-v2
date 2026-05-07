import type {
  LibrarySortBy,
  LibrarySortOrder,
  LibraryStatus,
  LibraryStatusCounts,
} from "@/features/filter-library/lib";

export type MobileFilterBarProps = {
  status: LibraryStatus | undefined;
  platform: string | undefined;
  minRating: number | undefined;
  unratedOnly: boolean | undefined;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
  /**
   * Optional per-status counts. Mirrors the sidebar — tanstack search-param
   * contract does not yet supply these (no `getStatusCounts` server fn ported);
   * the sheet renders without count badges when undefined.
   */
  counts?: LibraryStatusCounts;
  /**
   * Optional platform allow-list. Falls back to the same canonical default as
   * the sidebar.
   */
  platforms?: ReadonlyArray<string>;
};
