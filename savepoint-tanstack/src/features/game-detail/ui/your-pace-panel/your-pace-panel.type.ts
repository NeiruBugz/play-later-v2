export type YourPacePanelProps = {
  journalCount: number;
  playtimeTotalMinutes: number;
  /** Sessions that actually contributed minutes — the denominator for "Avg session". */
  playtimeSessionCount: number;
  /** Recent non-null per-session minutes, oldest→newest. */
  recentSessionMinutes: number[];
};
