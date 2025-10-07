import type {
  AcquisitionType,
  Game,
  LibraryItem,
  LibraryItemStatus,
} from "@prisma/client";

import type { ServiceResult } from "@/shared/services/types";

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for fetching library items for a specific game.
 * Note: gameId is required to match repository contract.
 */
export type GetLibraryItemsInput = {
  /** User ID to fetch library items for */
  userId: string;
  /** Game ID to fetch library items for (required) */
  gameId: string;
  /** Optional status filter */
  status?: LibraryItemStatus;
  /** Optional platform filter */
  platform?: string;
};

/**
 * Input for creating a new library item.
 * Status and acquisitionType have defaults if not provided.
 */
export type CreateLibraryItemInput = {
  /** User ID who owns the library item */
  userId: string;
  /** Game ID to add to library */
  gameId: string;
  /** Status of the library item (defaults to CURIOUS_ABOUT) */
  status?: LibraryItemStatus;
  /** Platform the game is on (e.g., "PC", "PlayStation 5") */
  platform?: string;
  /** How the game was acquired (defaults to DIGITAL) */
  acquisitionType?: AcquisitionType;
  /** When the user started playing */
  startedAt?: Date;
  /** When the user completed the game */
  completedAt?: Date;
};

/**
 * Input for updating an existing library item.
 * Note: Status is required to match repository contract
 */
export type UpdateLibraryItemInput = {
  /** User ID who owns the library item */
  userId: string;
  /** Library item ID to update */
  id: number;
  /** Updated status (required) */
  status: LibraryItemStatus;
  /** Updated platform */
  platform?: string;
  /** When the user started playing */
  startedAt?: Date;
  /** When the user completed the game */
  completedAt?: Date;
};

/**
 * Input for deleting a library item.
 */
export type DeleteLibraryItemInput = {
  /** User ID who owns the library item */
  userId: string;
  /** Library item ID to delete */
  libraryItemId: number;
};

/**
 * Input for counting library items with optional filters.
 */
export type GetLibraryCountInput = {
  /** User ID to count library items for */
  userId: string;
  /** Optional status filter */
  status?: LibraryItemStatus;
  /** Optional date filter (e.g., created after a date) */
  createdAfter?: Date;
};

// ============================================================================
// Output Types
// ============================================================================

/**
 * Library item with related Game data included.
 */
export type LibraryItemWithGame = LibraryItem & {
  game: Game;
};

/**
 * Result type for getLibraryItems operation.
 */
export type GetLibraryItemsResult = ServiceResult<{
  items: LibraryItem[];
  total: number;
}>;

/**
 * Result type for createLibraryItem operation.
 */
export type CreateLibraryItemResult = ServiceResult<{
  item: LibraryItem;
}>;

/**
 * Result type for updateLibraryItem operation.
 */
export type UpdateLibraryItemResult = ServiceResult<{
  item: LibraryItem;
}>;

/**
 * Result type for deleteLibraryItem operation.
 */
export type DeleteLibraryItemResult = ServiceResult<{
  message: string;
}>;

/**
 * Result type for getLibraryItemCount operation.
 */
export type GetLibraryCountResult = ServiceResult<{
  count: number;
}>;
