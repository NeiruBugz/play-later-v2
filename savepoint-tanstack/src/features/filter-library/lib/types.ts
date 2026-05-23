/**
 * Shared filter types — re-exported through the feature root barrel so other
 * layers continue to import from `@/features/filter-library` (unchanged
 * surface). The `library-filters` and `mobile-filter-bar` UI slices both
 * consume from here to stay in lockstep.
 */

export type LibraryStatus =
  | "PLAYING"
  | "PLAYED"
  | "UP_NEXT"
  | "SHELF"
  | "WISHLIST";

export type LibrarySortBy = "updatedAt" | "createdAt" | "title";
export type LibrarySortOrder = "asc" | "desc";

export type LibraryStatusCounts = Partial<Record<LibraryStatus, number>>;
