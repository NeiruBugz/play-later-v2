import type { NotePrompt } from "@/entities/journal-entry";

export type JournalEntryPageEntry = {
  id: string;
  content: string;
  playedMinutes: number | null;
  prompt?: NotePrompt | null;
  createdAt: Date;
  game: {
    id: string;
    title: string;
    slug: string;
  } | null;
};

export type JournalEntryPageProps = {
  entry: JournalEntryPageEntry;
};
