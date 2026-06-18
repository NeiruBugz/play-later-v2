import { JournalTeaser } from "@/entities/journal-entry";

import type { JournalPanelProps } from "./journal-panel.type";

export function JournalPanel({ entries, onAddEntryClick }: JournalPanelProps) {
  return (
    <>
      <h2 id="journal-teaser-heading" className="terminal-label">
        // JOURNAL
      </h2>
      <JournalTeaser entries={entries} onAddEntryClick={onAddEntryClick} />
    </>
  );
}
