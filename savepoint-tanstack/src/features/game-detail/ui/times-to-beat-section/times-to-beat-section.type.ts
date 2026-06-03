import type { TimesToBeat } from "@/entities/game/api";

export type TimesToBeatSectionProps = {
  /** Community benchmark in seconds, or `null` when no estimate exists. */
  timesToBeat: TimesToBeat | null;
  /** Viewer's total logged minutes for this game. */
  playtimeTotalMinutes: number;
  /** Viewer's journal-entry count for this game. */
  journalCount: number;
  /** Viewer's recent non-null per-session minutes, oldest→newest. */
  recentSessionMinutes: number[];
};
