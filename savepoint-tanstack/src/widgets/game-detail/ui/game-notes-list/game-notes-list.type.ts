import type { NotePrompt } from "@/entities/journal-entry";

export type GameNote = {
  id: string;
  content: string;
  playedMinutes: number | null;
  prompt?: NotePrompt | null;
  createdAt: Date;
};

export type GameNotesListProps = {
  notes: GameNote[];
  onNewNote: () => void;
};
