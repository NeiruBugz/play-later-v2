import type { AcquisitionType, LibraryItemStatus } from "./enums";

/**
 * Domain model for a library item.
 * Represents a game entry in a user's library with metadata about their progress and ownership.
 */
export interface LibraryItemDomain {
  id: number;
  userId: string;
  gameId: string;
  status: LibraryItemStatus;
  platform: string | null;
  acquisitionType: AcquisitionType | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain model for a library item with associated game information.
 * Transforms Prisma's `_count` structure to a more semantic `entryCount` field.
 */
export interface LibraryItemWithGameDomain extends LibraryItemDomain {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
    slug: string;
    releaseDate: Date | null;
    entryCount: number;
  };
}
