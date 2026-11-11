import type { ReactNode } from "react";

import type { GameDetailsResponseItem } from "@/shared/api/igdb";

import type {
  DoneOutcome,
  Game,
  LibraryItem,
} from "../../../../../shared/lib/prisma/client.ts";
import type { GameNote } from "../game-notes-list";
import type { Play } from "../play-history";

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
  /** How a Done game ended; the owner's own game only. */
  doneOutcome?: DoneOutcome | null;
  /** Which optional prompts to offer; both false unless the viewer owns the item. */
  prompts?: { why: boolean; stayed: boolean };
  /** The viewer's notes for this game, newest first. */
  notes: GameNote[];
  /** SUM of the viewer's logged playedMinutes for this game; 0 when none. */
  playtimeTotalMinutes: number;
  /** Count of journal entries carrying non-null playedMinutes — the true denominator for average session length. */
  playtimeSessionCount: number;
  /** Ended plays of the viewer's library entry; owner only, empty when none. */
  history?: Play[];
  timeToCreditsSeconds: number | null;
  timeToCompleteSeconds: number | null;
  coverTint: { hue: number; chroma: number } | null;
};

export type GameDetailProps = {
  data: GameDetailData;
  /** Authenticated viewer's user id, or `null` for anonymous viewers. */
  viewerUserId: string | null;
  /**
   * URL slug for this game — used by the sticky action bar to navigate to
   * `?action=log-session&game=<slug>` without requiring a server round-trip.
   */
  gameSlug?: string;
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
