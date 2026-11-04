import type { GameLibraryControlsProps } from "../game-library-controls";

export type GameDetailDetailRailProps = {
  /** Props forwarded directly to the embedded GameLibraryControls. */
  libraryControlsProps: GameLibraryControlsProps | null;
  /** React key to pass to GameLibraryControls so it resets when the game changes. */
  libraryControlsKey: string;
  /** Navigates to ?action=log-session&game=<slug>. */
  onLogSession: () => void;
  /** True only when the viewer has this game in their library. */
  showLogTime: boolean;
  /** Aggregated rating from IGDB — null when absent. */
  criticScore: number | null;
  /** SUM of logged playedMinutes for this game; 0 when none. */
  playtimeTotalMinutes: number;
  /** Count of journal entries carrying non-null playedMinutes. */
  playtimeSessionCount: number;
  /** Most recent session date string, or null. */
  lastSessionDate: string | null;
};
