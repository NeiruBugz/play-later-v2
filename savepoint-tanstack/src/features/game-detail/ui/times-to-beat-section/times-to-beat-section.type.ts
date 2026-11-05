import type { TimesToBeat } from "@/entities/game/api";

export type TimesToBeatSectionProps = {
  /** Community benchmark in seconds, or `null` when no estimate exists. */
  timesToBeat: TimesToBeat | null;
  /** Viewer's time played: the sum of this game's notes' minutes. */
  playtimeTotalMinutes: number;
  /** Viewer's count of notes with time. */
  playtimeSessionCount: number;
  /** Viewer's recent non-null per-session minutes, oldest→newest. */
  recentSessionMinutes: number[];
};
