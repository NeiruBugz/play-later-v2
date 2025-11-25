import type { JournalEntryDomain } from "@/shared/types";

export interface JournalEntriesSectionProps {
  journalEntries: JournalEntryDomain[];
}

export interface JournalEntryCardProps {
  entry: JournalEntryDomain;
}
