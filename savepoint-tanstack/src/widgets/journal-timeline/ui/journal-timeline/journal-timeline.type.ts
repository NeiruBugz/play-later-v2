/**
 * View-model the widget consumes. Mirrors the locked contract from Slice 15:
 * the widget renders only id/kind/title/content/createdAt/game. The entity
 * layer (`@/entities/journal-entry/model/types`) carries the wider Prisma
 * payload; the widget projects it down to a stable display surface.
 */
export type JournalTimelineEntry = {
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

export type JournalTimelineProps = {
  entries: JournalTimelineEntry[];
  /**
   * Optional callback fired when the user clicks an entry card. When
   * provided, every card becomes interactive. Wiring an opener (e.g., a
   * detail dialog) lives in the composing widget.
   */
  onEntrySelect?: (entryId: string) => void;
};
