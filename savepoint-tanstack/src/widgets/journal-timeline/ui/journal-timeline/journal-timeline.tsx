import { JournalEntryCard } from "@/entities/journal-entry/ui/journal-entry-card";

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
      <div className="bg-card border-border/10 space-y-xl flex min-h-[280px] flex-col items-center justify-center rounded-lg border px-6 py-12 text-center">
        <div className="space-y-sm max-w-md">
          <h2 className="text-lg font-semibold">Nothing logged yet</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Log tonight&apos;s session — a playtime count or a quick thought is
            enough. Reflections can come later.
          </p>
        </div>
      </div>
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
