/**
 * JournalService Types
 *
 * Type definitions for the journal service layer.
 * Input validation is handled at the server action layer via Zod.
 * These types focus on service layer inputs and outputs.
 *
 * @module shared/services/journal/types
 */

import type { JournalMood, JournalVisibility } from "@prisma/client";

import type { ServiceResult } from "../types";

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for getting journal entries with filtering.
 */
export type GetJournalEntriesInput = {
  userId: string;
  gameId?: string;
  libraryItemId?: number;
  visibility?: JournalVisibility;
  limit?: number;
  offset?: number;
};

/**
 * Input for creating a new journal entry.
 */
export type CreateJournalEntryInput = {
  userId: string;
  gameId: string;
  libraryItemId?: number;
  title?: string;
  content: string;
  mood?: JournalMood;
  playSession?: number;
  visibility?: JournalVisibility;
};

/**
 * Input for updating an existing journal entry.
 */
export type UpdateJournalEntryInput = {
  userId: string;
  id: string;
  title?: string;
  content?: string;
  mood?: JournalMood;
  playSession?: number;
  visibility?: JournalVisibility;
};

/**
 * Input for deleting a journal entry.
 */
export type DeleteJournalEntryInput = {
  id: string;
  userId: string;
};

/**
 * Input for getting journal statistics.
 */
export type GetJournalStatsInput = {
  userId: string;
};

// ============================================================================
// Output Types
// ============================================================================

/**
 * Journal entry data structure returned by service methods.
 */
export type JournalEntryData = {
  id: string;
  userId: string;
  gameId: string;
  libraryItemId: number | null;
  title: string | null;
  content: string;
  mood: JournalMood | null;
  playSession: number | null;
  visibility: JournalVisibility;
  isPublic: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  game?: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  libraryItem?: {
    id: number;
    status: string;
  } | null;
  user?: {
    id: string;
    username: string | null;
    name: string | null;
  };
};

/**
 * Journal statistics data structure.
 */
export type JournalStatsData = {
  totalEntries: number;
  totalPlayTime: number;
  moodDistribution: {
    mood: JournalMood;
    count: number;
  }[];
  recentEntries: number;
};

/**
 * Result type for getting journal entries.
 */
export type GetJournalEntriesResult = ServiceResult<{
  entries: JournalEntryData[];
  total: number;
}>;

/**
 * Result type for creating a journal entry.
 */
export type CreateJournalEntryResult = ServiceResult<{
  entry: JournalEntryData;
  message?: string;
}>;

/**
 * Result type for updating a journal entry.
 */
export type UpdateJournalEntryResult = ServiceResult<{
  entry: JournalEntryData;
  message?: string;
}>;

/**
 * Result type for deleting a journal entry.
 */
export type DeleteJournalEntryResult = ServiceResult<{
  message: string;
}>;

/**
 * Result type for getting journal statistics.
 */
export type GetJournalStatsResult = ServiceResult<{
  stats: JournalStatsData;
}>;
