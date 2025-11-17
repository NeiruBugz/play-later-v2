import type { LibraryItemStatus } from "@prisma/client";

export interface LibraryCardQuickActionsProps {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
}
