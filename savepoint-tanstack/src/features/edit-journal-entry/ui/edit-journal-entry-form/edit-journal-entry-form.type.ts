export type EditJournalEntryFormEntry = {
  id: string;
  content: string;
  playedMinutes: number | null;
  /** Time played needs a game, so the time field is hidden when there is none. */
  gameId: string | null;
};

export type EditJournalEntryFormProps = {
  entry: EditJournalEntryFormEntry;
};
