import type { JournalMood, JournalVisibility } from "./enums";

/**
 * Domain model for a journal entry.
 * Represents a user's thoughts and experiences about a game session.
 */
export interface JournalEntryDomain {
  id: string;
  userId: string;
  gameId: string;
  libraryItemId: number | null;
  title: string | null;
  content: string;
  mood: JournalMood | null;
  playSession: number | null;
  visibility: JournalVisibility;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}
