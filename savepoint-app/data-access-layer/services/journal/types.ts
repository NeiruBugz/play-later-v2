import type { JournalEntry } from "@prisma/client";

import type { ServiceResult } from "../types";

/**
 * Result of finding journal entries
 */
export type FindJournalEntriesResult = ServiceResult<JournalEntry[]>;

/**
 * Journal Service interface
 */
export interface JournalService {
  findJournalEntriesByGameId(params: {
    userId: string;
    gameId: string;
    limit?: number;
  }): Promise<FindJournalEntriesResult>;
}
