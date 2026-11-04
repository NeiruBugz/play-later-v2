export type JournalEntryCardEntry = {
  id: string;
  content: string;
  playedMinutes: number | null;
  createdAt: Date;
  game: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
  } | null;
};

export type JournalEntryCardProps = {
  entry: JournalEntryCardEntry;
  /**
   * Optional click handler. When provided, the card body becomes an
   * interactive element that calls `onSelect(entry.id)` on click. The entity
   * stays display-only — it does not import features; the composing layer
   * (widget) wires what happens on click (e.g., open the note view).
   */
  onSelect?: (entryId: string) => void;
};
