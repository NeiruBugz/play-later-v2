/**
 * Data Transfer Object for library items exposed through API endpoints.
 * Serializes dates to ISO strings for JSON compatibility.
 */
export interface LibraryItemDTO {
  id: number;
  userId: string;
  gameId: string;
  status: string;
  platform: string | null;
  acquisitionType: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for library item with game information.
 * Used for API responses that include related game data.
 */
export interface LibraryItemWithGameDTO extends LibraryItemDTO {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
    slug: string;
    releaseDate: string | null;
    entryCount: number;
  };
}
