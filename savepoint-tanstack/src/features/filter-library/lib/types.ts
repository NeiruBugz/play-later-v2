/**
 * Shared filter types — re-exported through the feature root barrel so other
 * layers continue to import from `@/features/filter-library` (unchanged
 * surface). The `library-filters` and `mobile-filter-bar` UI slices both
 * consume from here to stay in lockstep.
 */

export type LibraryStatus = "WANT" | "PLAYING" | "DONE" | "UP_NEXT";

export type LibrarySortBy = "updatedAt" | "createdAt" | "title";
export type LibrarySortOrder = "asc" | "desc";

export type LibraryStatusCounts = Partial<Record<LibraryStatus, number>>;
