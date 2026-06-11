import type { PlaythroughWithEntries } from "@/entities/playthrough";

import type { JournalEntry } from "../../../../../shared/lib/prisma/client.ts";

export type JournalFeedProps = {
  playthroughs: PlaythroughWithEntries[];
  /**
   * Entries with no associated playthrough (playthroughId = null).
   * Rendered newest-first interleaved with run entries, with no run label.
   * Covers spec 016 §2.7 (detached on run delete) and §2.10 (legacy entries).
   * Uses the base JournalEntry type — the feed renders only scalar fields.
   */
  legacyEntries?: JournalEntry[];
};
