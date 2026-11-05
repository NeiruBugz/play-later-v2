import type { NotePrompt } from "@/entities/journal-entry";

export type JournalTimelineEntry = {
  id: string;
  content: string;
  playedMinutes: number | null;
  prompt?: NotePrompt | null;
  createdAt: Date;
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
   * note view) lives in the composing widget.
   */
  onEntrySelect?: (entryId: string) => void;
};
