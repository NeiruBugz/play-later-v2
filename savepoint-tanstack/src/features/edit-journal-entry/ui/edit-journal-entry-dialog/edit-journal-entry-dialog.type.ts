export type EditJournalEntryDialogEntry = {
  id: string;
  content: string;
  kind: "QUICK" | "REFLECTION";
  gameId: string | null;
};

export type EditJournalEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: EditJournalEntryDialogEntry;
};
