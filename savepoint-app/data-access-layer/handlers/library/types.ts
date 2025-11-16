/**
 * Library handler types
 */

import type { LibraryItemWithGameAndCount } from "@/shared/types";

// Re-export for handler use
export type { LibraryItemWithGameAndCount };

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
