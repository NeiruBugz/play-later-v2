import type { LibraryItemWithGame } from "@/entities/library-item/model";

import type { DashboardGameSectionViewAll } from "../dashboard-game-section/dashboard-game-section.type";

export type DashboardGameRailProps = {
  title: string;
  items: LibraryItemWithGame[];
  viewAll: DashboardGameSectionViewAll;
  viewAllLabel?: string;
  emptyMessage?: string;
};
