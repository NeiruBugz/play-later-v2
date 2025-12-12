import type { JournalEntryDomain } from "@/shared/types";

export interface JournalEntriesSectionProps {
  journalEntries: JournalEntryDomain[];
  gameId?: string;
}

export interface JournalEntryCardProps {
  entry: JournalEntryDomain;
}
