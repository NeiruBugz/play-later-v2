import type { LibraryStats } from "@/entities/library-item/api/get-library-stats.server";

export type OverviewTabProps = {
  stats: LibraryStats;
  gameCount: number;
};
