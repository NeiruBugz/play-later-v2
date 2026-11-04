export type YourPacePanelProps = {
  playtimeTotalMinutes: number;
  /** Notes with time — the session count shown and the denominator for "Per session". */
  playtimeSessionCount: number;
  /** Recent non-null per-session minutes, oldest→newest. */
  recentSessionMinutes: number[];
};
