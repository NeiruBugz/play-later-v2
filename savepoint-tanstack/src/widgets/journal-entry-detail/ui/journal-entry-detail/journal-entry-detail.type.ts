export type JournalEntryDetailEntry = {
  id: string;
  kind: "QUICK" | "REFLECTION";
  title: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  gameId: string | null;
  game: {
    id: string;
    title: string;
    slug: string;
  } | null;
};

export type JournalEntryDetailProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntryDetailEntry;
  /** Fired when the user clicks "Edit". The widget itself does not open
   *  the edit dialog — the composing widget owns that state. */
  onEdit: (entryId: string) => void;
  /** Fired when the user clicks "Delete". */
  onDelete: (entryId: string) => void;
};
