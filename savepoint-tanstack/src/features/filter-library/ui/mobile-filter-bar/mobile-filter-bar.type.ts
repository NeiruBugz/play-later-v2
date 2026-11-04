import type {
  LibrarySortBy,
  LibrarySortOrder,
  LibraryStatus,
} from "@/features/filter-library/lib";

export type MobileFilterBarProps = {
  status: LibraryStatus | undefined;
  platform: string | undefined;
  minRating: number | undefined;
  unratedOnly: boolean | undefined;
  notOwnedOnly?: boolean | undefined;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
  /**
   * Optional platform allow-list. Falls back to the same canonical default as
   * the sidebar.
   */
  platforms?: ReadonlyArray<string>;
};
