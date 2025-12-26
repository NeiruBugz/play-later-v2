import type { JournalEntryDomain } from "@/shared/types";

export interface JournalEntriesSectionProps {
  journalEntries: JournalEntryDomain[];
  gameId: string;
  gameTitle: string;
}

export interface JournalEntryCardProps {
  entry: JournalEntryDomain;
}
