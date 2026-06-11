import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import type { PlaythroughWithEntries } from "@/entities/playthrough";

import type { JournalFeedProps } from "./journal-feed.type";

const KIND_LABEL: Record<string, string> = {
  FIRST: "First playthrough",
  REPLAY: "Replay",
};

type FlatEntry = {
  entry: JournalTimelineEntry;
  runLabel: string | null;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatHours(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  return `${Math.floor(minutes / 60)}h`;
}

function flattenEntries(
  playthroughs: PlaythroughWithEntries[],
  legacyEntries: JournalTimelineEntry[]
): FlatEntry[] {
  const runById = new Map<string, PlaythroughWithEntries>();
  for (const pt of playthroughs) {
    runById.set(pt.id, pt);
  }

  const fromRuns: FlatEntry[] = playthroughs.flatMap((pt) =>
    pt.journalEntries.map((entry) => ({
      entry: entry as JournalTimelineEntry,
      runLabel: KIND_LABEL[pt.kind] ?? null,
    }))
  );

  const fromLegacy: FlatEntry[] = legacyEntries.map((entry) => ({
    entry,
    runLabel: null,
  }));

  return [...fromRuns, ...fromLegacy].sort(
    (a, b) =>
      new Date(b.entry.createdAt).getTime() -
      new Date(a.entry.createdAt).getTime()
  );
}

export function JournalFeed({
  playthroughs,
  legacyEntries = [],
}: JournalFeedProps) {
  if (playthroughs.length === 0) {
    return null;
  }

  const flat = flattenEntries(playthroughs, legacyEntries);

  if (flat.length === 0) {
    return null;
  }

  return (
    <section aria-label="Journal feed">
      <ul role="list" className="flex flex-col gap-4">
        {flat.map(({ entry, runLabel }) => {
          const hours = formatHours(entry.playedMinutes);
          return (
            <li key={entry.id} role="article" className="flex flex-col gap-0.5">
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                <span>{formatDate(entry.createdAt)}</span>
                {runLabel ? <span>{runLabel}</span> : null}
                {hours ? <span className="font-mono">{hours}</span> : null}
              </div>
              <em className="text-foreground text-sm">{entry.content}</em>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
