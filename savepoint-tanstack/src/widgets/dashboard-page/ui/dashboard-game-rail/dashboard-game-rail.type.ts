import type { LibraryItemWithGame } from "@/entities/library-item/model";

export type DashboardGameRailProps = {
  title: string;
  items: LibraryItemWithGame[];
  viewAll: { status: "UP_NEXT" };
  viewAllLabel?: string;
  emptyMessage: string;
};
