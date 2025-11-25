import type { LibraryItemStatus } from "@/shared/types";

export interface LibraryCardActionBarProps {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
}
