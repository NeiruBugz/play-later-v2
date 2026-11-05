import type { TimesToBeat } from "@/entities/game/api";

export type TimesToBeatSectionProps = {
  /** Community benchmark in seconds, or `null` when no estimate exists. */
  timesToBeat: TimesToBeat | null;
};
