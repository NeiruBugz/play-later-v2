import type {
  LibrarySortBy,
  LibrarySortOrder,
  LibraryStatusCounts,
} from "@/features/filter-library/lib";

/**
 * StatusLens accepts the full filter state so it can pass the correct
 * search patch through `useLibraryFiltersState` without losing the active
 * platform/sort/etc. when the user taps a status chip.
 *
 * `status` and `acquisition` are typed as `string | undefined` (wider than the
 * domain unions) because StatusLens is a pure pass-through for those two values —
 * it never reads `acquisition`, and it only reads `status` to compare against the
 * `__all__` sentinel. The internal cast to the narrower union happens inside the
 * component before the value reaches the hook. Widening here removes the need for
 * callers and tests to assert to the exact union type.
 */
export type StatusLensProps = {
  status: string | undefined;
  counts?: LibraryStatusCounts;
  platform: string | undefined;
  acquisition: string | undefined;
  startedOnly: boolean | undefined;
  minRating: number | undefined;
  unratedOnly: boolean | undefined;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
};
