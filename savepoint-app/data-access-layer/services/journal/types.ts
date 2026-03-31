import type { JournalEntryDomain } from "@/features/journal/types";

import type { ServiceResult } from "../types";

export type FindJournalEntriesResult = ServiceResult<JournalEntryDomain[]>;

export interface JournalService {
  findJournalEntriesByGameId(params: {
    userId: string;
    gameId: string;
    limit?: number;
  }): Promise<FindJournalEntriesResult>;
}
