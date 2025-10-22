import type { JournalMood, JournalVisibility } from "@prisma/client";

import type { ServiceResult } from "../types";

export type GetJournalEntriesInput = {
  userId: string;
  gameId?: string;
  libraryItemId?: number;
  visibility?: JournalVisibility;
  limit?: number;
  offset?: number;
};

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

export type UpdateJournalEntryInput = {
  userId: string;
  id: string;
  title?: string;
  content?: string;
  mood?: JournalMood;
  playSession?: number;
  visibility?: JournalVisibility;
};

export type DeleteJournalEntryInput = {
  id: string;
  userId: string;
};

export type GetJournalStatsInput = {
  userId: string;
};

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

export type GetJournalEntriesResult = ServiceResult<{
  entries: JournalEntryData[];
  total: number;
}>;

export type CreateJournalEntryResult = ServiceResult<{
  entry: JournalEntryData;
  message?: string;
}>;

export type UpdateJournalEntryResult = ServiceResult<{
  entry: JournalEntryData;
  message?: string;
}>;

export type DeleteJournalEntryResult = ServiceResult<{
  message: string;
}>;

export type GetJournalStatsResult = ServiceResult<{
  stats: JournalStatsData;
}>;
