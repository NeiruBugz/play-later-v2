import type { JournalEntry } from "../../../../../shared/lib/prisma/client.ts";

export type JournalTeaserProps = {
  entries: JournalEntry[];
  /**
   * Optional click handler for an inline "Add entry" affordance. When
   * provided, the teaser renders the button at the top of the section. The
   * entity stays display-only — actual compose-dialog wiring lives in the
   * composing widget (e.g. `widgets/game-detail`).
   */
  onAddEntryClick?: () => void;
};
