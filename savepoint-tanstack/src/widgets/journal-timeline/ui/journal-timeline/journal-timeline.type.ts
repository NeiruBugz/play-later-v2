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
