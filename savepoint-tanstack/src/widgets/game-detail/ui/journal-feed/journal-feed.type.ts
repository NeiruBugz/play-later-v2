import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import type { PlaythroughWithEntries } from "@/entities/playthrough";

export type JournalFeedProps = {
  playthroughs: PlaythroughWithEntries[];
  legacyEntries?: JournalTimelineEntry[];
};
