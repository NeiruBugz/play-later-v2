import type {
  LibraryAcquisition,
  LibrarySortBy,
  LibrarySortOrder,
  LibraryStatus,
  LibraryStatusCounts,
} from "@/features/filter-library/lib";

export type MobileFilterBarProps = {
  status: LibraryStatus | undefined;
  platform: string | undefined;
  acquisition: LibraryAcquisition | undefined;
  startedOnly: boolean | undefined;
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
  /**
   * Current grid/list view mode. When provided, the component renders the
   * Grid/List view toggle buttons in the same row as the Filters trigger
   * (Finding #15 — single-row controls layout).
   */
  viewMode?: "grid" | "list";
  /**
   * Callback invoked when the user selects a view mode from the inline toggle.
   * Required when `viewMode` is provided.
   */
  onViewModeChange?: (mode: "grid" | "list") => void;
};
