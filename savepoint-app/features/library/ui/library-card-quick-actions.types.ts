import type { LibraryItemStatus } from "@/shared/types";

export interface LibraryCardQuickActionsProps {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
}
