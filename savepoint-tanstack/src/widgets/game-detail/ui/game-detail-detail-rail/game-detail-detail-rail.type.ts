import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";
import type { LibraryStatusSwitcherProps } from "../library-status-switcher/library-status-switcher.type";

export type GameDetailDetailRailProps = {
  /** Props forwarded directly to the embedded LibraryStatusSwitcher. */
  statusSwitcherProps: LibraryStatusSwitcherProps | null;
  /** React key to pass to LibraryStatusSwitcher so it resets when the game changes. */
  statusSwitcherKey: string;
  /** Navigates to ?action=log-session&game=<slug>. */
  onLogSession: () => void;
  /** Aggregated rating from IGDB — null when absent. */
  criticScore: number | null;
  /** SUM of logged playedMinutes for this game; 0 when none. */
  playtimeTotalMinutes: number;
  /** Count of journal entries carrying non-null playedMinutes. */
  playtimeSessionCount: number;
  /** Most recent session date string, or null. */
  lastSessionDate: string | null;
  /** Derived status for the game — used to display your overall progress. */
  derivedStatus: LibraryItemStatus | null;
};
