import type {
  LibraryStatus,
  LibraryStatusCounts,
} from "@/features/filter-library/lib";

export type StatusListVariant = "sidebar" | "sheet";

export type StatusListProps = {
  currentStatus: LibraryStatus | "__all__";
  counts?: LibraryStatusCounts;
  onPick: (value: LibraryStatus) => void;
  /**
   * `sidebar` — uses `STATUS_FILTER_STYLES` two-tone active/inactive palette
   *   and also renders the "All" pill with total count badge.
   * `sheet` — simpler `bg-secondary` active state; no "All" pill (sheet header
   *   provides overall context).
   */
  variant: StatusListVariant;
  /** Required for sidebar variant to render the "All" pill. */
  onAll?: () => void;
  /** Total count badge on the "All" pill (sidebar only). */
  totalCount?: number;
};
