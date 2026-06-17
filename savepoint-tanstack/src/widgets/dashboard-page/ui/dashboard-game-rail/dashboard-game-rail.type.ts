import type { LibraryItemWithGame } from "@/entities/library-item/model";

import type { DashboardGameSectionViewAll } from "../dashboard-game-section/dashboard-game-section.type";

export type DashboardGameRailProps = {
  title: string;
  items: LibraryItemWithGame[];
  totalCount?: number;
  viewAll: DashboardGameSectionViewAll;
  viewAllLabel?: string;
  emptyMessage?: string;
};
