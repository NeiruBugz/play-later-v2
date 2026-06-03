export type YourPacePanelProps = {
  journalCount: number;
  playtimeTotalMinutes: number;
  /** Recent non-null per-session minutes, oldest→newest. */
  recentSessionMinutes: number[];
};
