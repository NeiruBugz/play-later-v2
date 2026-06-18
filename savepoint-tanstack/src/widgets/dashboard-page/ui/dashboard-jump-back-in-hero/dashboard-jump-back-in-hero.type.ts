import type { DashboardQuickLogGame } from "@/features/dashboard";

export type DashboardHeroGame = DashboardQuickLogGame & {
  sessions?: number;
  hoursPlayed?: number;
  progress?: number;
};

export type DashboardJumpBackInHeroProps = {
  mostInProgressGame: DashboardHeroGame | null;
};
