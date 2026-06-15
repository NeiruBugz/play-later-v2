import type {
  LibraryItem,
  LibraryItemStatus,
} from "../../../../../shared/lib/prisma/client.ts";

export type LibraryStatusSwitcherProps = {
  igdbId: number;
  gameTitle: string;
  entry: LibraryItem | null;
  /** Number of recorded playthroughs for this library entry. */
  playthroughCount: number;
  /**
   * Status derived from runs (Playing > Finished/Abandoned → Played).
   * Shown as a read-only pill when playthroughCount > 0 and !statusIsManual.
   */
  derivedStatus: LibraryItemStatus;
  /**
   * True when the user has pinned a status manually via "Set manually."
   * Pill shows the entry's current status with a "Set manually" caption.
   */
  statusIsManual: boolean;
};

export type StatusPill = {
  value: LibraryItemStatus;
  label: string;
};
