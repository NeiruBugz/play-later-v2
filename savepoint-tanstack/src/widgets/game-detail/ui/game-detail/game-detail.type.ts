import type { ReactNode } from "react";

import type {
  Game,
  JournalEntry,
  LibraryItem,
} from "../../../../../shared/lib/prisma/client.ts";

export type GameDetailData = {
  game: Game;
  relatedGames: Game[];
  libraryEntry: LibraryItem | null;
  journalTeaser: JournalEntry[];
};

export type GameDetailProps = {
  data: GameDetailData;
  /** Authenticated viewer's user id, or `null` for anonymous viewers. */
  viewerUserId: string | null;
  /**
   * Optional Suspense-wrapped related-games slot. Rendered as-is below the
   * journal teaser. The route owns the Suspense + Await + error boundary
   * plumbing; the widget stays prop-driven and unit-testable.
   */
  relatedGamesSlot?: ReactNode;
  /**
   * Optional Suspense-wrapped times-to-beat slot. Rendered after the
   * library-status strip column when present.
   */
  timesToBeatSlot?: ReactNode;
};
