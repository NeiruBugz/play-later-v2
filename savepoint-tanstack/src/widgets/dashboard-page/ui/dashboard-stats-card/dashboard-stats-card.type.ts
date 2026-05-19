import type { DashboardStatusCounts } from "@/features/dashboard";

export type DashboardStatsCardProps = {
  statusCounts: DashboardStatusCounts;
  /** Pre-summed total — caller computes this from the same counts. */
  total: number;
};
