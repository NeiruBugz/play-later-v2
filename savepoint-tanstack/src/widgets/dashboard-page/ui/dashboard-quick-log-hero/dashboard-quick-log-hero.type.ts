import type { DashboardQuickLogGame } from "@/features/dashboard";

export type DashboardQuickLogHeroProps = {
  /** Email-safe greeting target — caller has already filtered legacy emails. */
  username: string;
  /** Up to 3 PLAYING games, ordered by latest activity. */
  playingGames: DashboardQuickLogGame[];
};
