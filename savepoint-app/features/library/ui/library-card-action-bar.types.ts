import type { LibraryItemStatus } from "@prisma/client";

export interface LibraryCardActionBarProps {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
}
