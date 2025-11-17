import type { LibraryItemStatus } from "@prisma/client";

export interface LibraryCardInteractiveBadgeProps {
  libraryItemId: number;
  currentStatus: LibraryItemStatus;
  statusVariant: "default" | "secondary" | "outline" | "destructive";
}
