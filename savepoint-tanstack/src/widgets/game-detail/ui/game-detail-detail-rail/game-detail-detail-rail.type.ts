export type GameDetailDetailRailProps = {
  /** True only when the viewer has this game in their library. */
  showPlaytime: boolean;
  /** Aggregated rating from IGDB — null when absent. */
  criticScore: number | null;
  /** SUM of logged playedMinutes for this game; 0 when none. */
  playtimeTotalMinutes: number;
  /** Count of journal entries carrying non-null playedMinutes. */
  playtimeSessionCount: number;
  /** Most recent session date string, or null. */
  lastSessionDate: string | null;
};
