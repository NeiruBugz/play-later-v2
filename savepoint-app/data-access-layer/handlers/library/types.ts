/**
 * Library handler types
 */

/**
 * Library item with game details and count
 * Re-exported from service layer for handler use
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

/**
 * Get library handler input parameters
 */
export interface GetLibraryHandlerInput {
  /** User ID (CUID format) */
  userId: string;
  /** Optional filter by library item status */
  status?: string;
  /** Optional filter by platform */
  platform?: string;
  /** Optional search query for game titles */
  search?: string;
  /** Optional sort field */
  sortBy?: "createdAt" | "releaseDate" | "startedAt" | "completedAt";
  /** Optional sort order */
  sortOrder?: "asc" | "desc";
}

/**
 * Get library handler output
 * Returns array of library items with game details
 */
export type GetLibraryHandlerOutput = LibraryItemWithGameAndCount[];
