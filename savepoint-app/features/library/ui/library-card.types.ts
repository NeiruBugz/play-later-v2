import type { LibraryItemWithGameDomain } from "@/features/library/types";
import type { LibraryItemStatus } from "@/shared/types";

export interface LibraryCardProps {
  item: LibraryItemWithGameDomain;
  /**
   * When set, the card suppresses its own status badge if the card's status
   * equals this filter (the badge is redundant when the view is already
   * scoped to that status).
   */
  activeStatusFilter?: LibraryItemStatus;
}
