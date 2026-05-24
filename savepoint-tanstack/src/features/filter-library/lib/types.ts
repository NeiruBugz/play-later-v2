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

/**
 * The three real `AcquisitionType` enum values. SUBSCRIPTION covers both Game
 * Pass and PS+ — the DB cannot distinguish them, so the filter keys on the
 * stored value while the per-card chip resolves the brand from platform.
 */
export type LibraryAcquisition = "DIGITAL" | "SUBSCRIPTION" | "PHYSICAL";
