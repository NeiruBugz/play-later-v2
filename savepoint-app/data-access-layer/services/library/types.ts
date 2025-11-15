import type { LibraryItem, LibraryItemStatus } from "@prisma/client";

import type { ServiceResult } from "../types";

/**
 * Input for adding a game to user's library
 */
export type AddGameToLibraryInput = {
  userId: string;
  igdbId: number;
  status: LibraryItemStatus;
  platform?: string;
  startedAt?: Date;
  completedAt?: Date;
};

/**
 * Result of adding a game to library
 */
export type AddGameToLibraryResult = ServiceResult<{
  libraryItem: LibraryItem;
  gameSlug: string;
}>;

/**
 * Library Service interface
 */
export interface LibraryService {
  addGameToLibrary(
    input: AddGameToLibraryInput
  ): Promise<AddGameToLibraryResult>;
}
