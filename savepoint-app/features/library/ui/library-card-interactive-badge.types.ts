import type { LibraryItemStatus } from "@/shared/types";

export interface LibraryCardInteractiveBadgeProps {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
}
