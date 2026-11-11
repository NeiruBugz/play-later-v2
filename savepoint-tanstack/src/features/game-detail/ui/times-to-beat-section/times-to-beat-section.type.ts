export type LiveTimesToBeat = {
  mainStory: number | null;
  completionist: number | null;
};

export type TimesToBeatSectionProps = {
  /** Community benchmark in seconds, or `null` when no estimate exists. */
  timesToBeat: LiveTimesToBeat | null;
};
