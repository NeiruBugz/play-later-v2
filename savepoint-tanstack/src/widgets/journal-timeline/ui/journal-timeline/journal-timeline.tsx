import { JournalEntryCard } from "@/entities/journal-entry/ui/journal-entry-card";
import { EmptyState } from "@/shared/ui/empty-state";

import type {
  JournalTimelineEntry,
  JournalTimelineProps,
} from "./journal-timeline.type";

export type { JournalTimelineEntry };

/**
 * Widget that composes a list of journal entries into a vertical timeline.
 * Each entry is rendered by the entity-layer `JournalEntryCard` (one journal
 * entry = entity concern; the list of them = widget concern).
 *
 * Display-only: data is fetched by the route loader and passed in as a prop.
 */
export function JournalTimeline({
  entries,
  onEntrySelect,
}: JournalTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Nothing logged yet"
        description="Log tonight's session — a playtime count or a quick thought is enough. Reflections can come later."
      />
    );
  }

  return (
    <div className="space-y-lg" aria-label="Journal timeline">
      {entries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          onSelect={onEntrySelect}
        />
      ))}
    </div>
  );
}
