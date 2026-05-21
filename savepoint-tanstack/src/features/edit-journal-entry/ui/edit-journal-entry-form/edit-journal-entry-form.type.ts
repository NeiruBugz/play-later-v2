export type EditJournalEntryFormEntry = {
  id: string;
  content: string;
  kind: "QUICK" | "REFLECTION";
  gameId: string | null;
};

export type EditJournalEntryFormProps = {
  entry: EditJournalEntryFormEntry;
};
