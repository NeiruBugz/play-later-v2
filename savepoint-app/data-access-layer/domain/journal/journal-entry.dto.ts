/**
 * Data Transfer Object for journal entries exposed through API endpoints.
 * Serializes dates to ISO strings for JSON compatibility.
 */
export interface JournalEntryDTO {
  id: string;
  userId: string;
  gameId: string;
  libraryItemId: number | null;
  title: string | null;
  content: string;
  mood: string | null;
  playSession: number | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}
