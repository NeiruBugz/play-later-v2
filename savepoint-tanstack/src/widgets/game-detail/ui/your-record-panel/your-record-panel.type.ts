export type YourRecordPanelProps = {
  /** Library item id, or `null` when the game is not in the viewer's library. */
  itemId: number | null;
  /** Current rating (1–10 half-step), or `null` when unrated. */
  rating: number | null;
  /** SUM of the viewer's logged playedMinutes; 0 when none (playtime then hidden). */
  playtimeTotalMinutes: number;
  /** True count of journal entries — the "sessions" figure. */
  journalCount: number;
  /** For the rating control's aria-label. */
  gameTitle: string;
  /** Opens the shared compose dialog mounted by the widget. */
  onLogSession: () => void;
};
