import type { LibraryItemStatus } from "@prisma/client";

export interface QuickActionButtonsProps {
  igdbId: number;
  gameTitle: string;
  currentStatus?: LibraryItemStatus;
}
