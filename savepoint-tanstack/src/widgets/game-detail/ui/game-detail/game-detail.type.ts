import type { ReactNode } from "react";

import type { GameDetailsResponseItem } from "@/shared/api/igdb";

import type {
  Game,
  JournalEntry,
  LibraryItem,
} from "../../../../../shared/lib/prisma/client.ts";

export type GameDetailData = {
  /** Thin cached Game row — anchor for cross-feature reads. */
  game: Game;
  /**
   * Live IGDB payload — source of truth for summary, genres, platforms,
   * screenshots, involved companies, themes, aggregated rating. NOT
   * persisted. The widget reads display data from here.
   */
  igdbDetails: GameDetailsResponseItem;
  libraryEntry: LibraryItem | null;
  journalTeaser: JournalEntry[];
  /** True count of the viewer's journal entries — NOT capped at the teaser limit. */
  journalCount: number;
  /** SUM of the viewer's logged playedMinutes for this game; 0 when none. */
  playtimeTotalMinutes: number;
  /** Count of journal entries carrying non-null playedMinutes — the true denominator for average session length. */
  playtimeSessionCount: number;
  /** Recent non-null playedMinutes, oldest→newest, bounded for a rhythm chart. */
  recentSessionMinutes: number[];
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
