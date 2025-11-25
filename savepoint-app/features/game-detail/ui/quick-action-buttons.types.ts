import type { LibraryItemStatus } from "@/shared/types";

export interface QuickActionButtonsProps {
  igdbId: number;
  gameTitle: string;
  currentStatus?: LibraryItemStatus;
}
