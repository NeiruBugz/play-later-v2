import type { JournalGameFilterOption } from "@/features/journal-timeline/ui/journal-game-filter";
import type { JournalTimelineEntry } from "@/widgets/journal-timeline";

export type JournalTimelinePageProps = {
  entries: JournalTimelineEntry[];
  /** The games that have notes, offered by the filter next to "All" and "No game". */
  gameOptions: JournalGameFilterOption[];
  /** A game id, `"none"` for notes without a game, or `undefined` for all notes. */
  selectedGame: string | undefined;
};
