/**
 * Display-only view of one journal entry. Mirrors the Slice 15 timeline
 * contract — the wider Prisma payload (`model/types.ts`) carries more
 * fields, surfaced when CRUD lands (Slice 16).
 */
export type JournalEntryCardEntry = {
  id: string;
  kind: "QUICK" | "REFLECTION";
  title: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
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
   * (widget) wires what happens on click (e.g., open a detail dialog).
   */
  onSelect?: (entryId: string) => void;
};
