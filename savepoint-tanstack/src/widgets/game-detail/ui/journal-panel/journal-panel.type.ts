import type { JournalEntry } from "../../../../../shared/lib/prisma/client.ts";

export type JournalPanelProps = {
  entries: JournalEntry[];
  onAddEntryClick: () => void;
};
