/**
 * Shared library types used across the application
 */

/**
 * Library item with associated game details and count
 * Used by API responses, handlers, and client-side hooks
 */
export interface LibraryItemWithGameAndCount {
  id: number;
  userId: string;
  gameId: string;
  status: string;
  platform: string | null;
  acquisitionType: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  game: {
    id: string;
    title: string;
    coverImage: string | null;
    slug: string;
    releaseDate: Date | null;
    _count: {
      libraryItems: number;
    };
  };
}
