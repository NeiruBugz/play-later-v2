import type { DashboardQuickLogGame } from "@/features/dashboard";

export type DashboardJumpBackInHeroProps = {
  /** First-name greeting target. */
  username: string;
  /**
   * The single most in-progress game to feature in the hero card.
   * Null when the user has nothing actively playing.
   */
  mostInProgressGame: DashboardQuickLogGame | null;
};
