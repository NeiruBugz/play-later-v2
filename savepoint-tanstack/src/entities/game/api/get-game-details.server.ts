import {
  getGameDetailsFromIgdb,
  type GameDetailsResponseItem,
} from "@/shared/api/igdb";
import { prisma } from "@/shared/lib/db.server";
import {
  deriveHasBeenPlayed,
  deriveLibraryStatus,
} from "@/shared/lib/derive-playthrough-status";
import { NotFoundError } from "@/shared/lib/errors";

import type {
  Game,
  JournalEntry,
  LibraryItem,
  LibraryItemStatus,
  Playthrough,
} from "../../../../shared/lib/prisma/client.ts";
import { upsertThinGameFromIgdbDetailsPayload } from "./upsert-game.server";

type PlaythroughWithEntries = Playthrough & { journalEntries: JournalEntry[] };

const JOURNAL_TEASER_LIMIT = 3;
const RECENT_SESSION_LIMIT = 9;

export interface GameDetails {
  game: Game;
  igdbDetails: GameDetailsResponseItem;
  libraryEntry: LibraryItem | null;
  journalTeaser: JournalEntry[];
  /** True count of the viewer's journal entries — NOT capped at the teaser limit. */
  journalCount: number;
  /** Sum of playthroughs' playtimeMinutes for this game; 0 when none. */
  playtimeTotalMinutes: number;
  /** Count of journal entries carrying non-null playedMinutes — the true denominator for average session length. */
  playtimeSessionCount: number;
  /** Recent non-null playedMinutes, oldest→newest, bounded for a rhythm chart. */
  recentSessionMinutes: number[];
  playthroughs: PlaythroughWithEntries[];
  derivedStatus: LibraryItemStatus;
  statusIsManual: boolean;
  hasBeenPlayed: boolean;
  /**
   * Journal entries for this game with no associated playthrough (playthroughId = null).
   * Covers two cases from spec 016:
   *   §2.7  — entries detached when a run is deleted.
   *   §2.10 — legacy pre-spec entries created before playthroughs existed.
   *
   * Only populated when the user is authenticated AND the game has at least one run.
   * Per §2.11 the JournalFeed is hidden when there are no runs, so we gate the
   * fetch here to keep the data-layer contract consistent with the UI invariant.
   * Empty ([]) for anonymous viewers, games with no library entry, or games with no runs.
   *
   * NOTE for react-frontend agent: pass this field as `legacyEntries` to `JournalFeed`.
   */
  unattachedJournalEntries: JournalEntry[];
}

export async function getGameDetails(params: {
  slug: string;
  userId?: string;
}): Promise<GameDetails> {
  const { slug, userId } = params;

  const igdbDetails = await getGameDetailsFromIgdb(slug);
  if (!igdbDetails) {
    throw new NotFoundError("Game not found", { slug });
  }

  const game = await upsertThinGameFromIgdbDetailsPayload(igdbDetails);

  let libraryEntry: LibraryItem | null = null;
  let journalTeaser: JournalEntry[] = [];
  let journalCount = 0;
  let playtimeTotalMinutes = 0;
  let playtimeSessionCount = 0;
  let recentSessionMinutes: number[] = [];
  let playthroughs: PlaythroughWithEntries[] = [];
  let unattachedJournalEntries: JournalEntry[] = [];

  if (userId) {
    // Step 1: fetch library entry + journal aggregates in parallel.
    // Playthrough query depends on libraryEntry.id so it must come after.
    const [entry, teaser, count, sessionAggregate, recentMinutesRows] =
      await Promise.all([
        prisma.libraryItem.findFirst({
          where: { userId, gameId: game.id },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.journalEntry.findMany({
          where: { userId, gameId: game.id },
          orderBy: { createdAt: "desc" },
          take: JOURNAL_TEASER_LIMIT,
        }),
        prisma.journalEntry.count({
          where: { userId, gameId: game.id },
        }),
        prisma.journalEntry.aggregate({
          where: { userId, gameId: game.id, playedMinutes: { not: null } },
          _count: { playedMinutes: true },
        }),
        prisma.journalEntry.findMany({
          where: { userId, gameId: game.id, playedMinutes: { not: null } },
          orderBy: { createdAt: "desc" },
          take: RECENT_SESSION_LIMIT,
          select: { playedMinutes: true },
        }),
      ]);

    libraryEntry = entry;
    journalTeaser = teaser;
    journalCount = count;
    playtimeSessionCount = sessionAggregate._count.playedMinutes;
    // Fetched newest→oldest for the "most recent" bound; reverse to oldest→newest
    // so the rhythm chart reads left-to-right.
    recentSessionMinutes = recentMinutesRows
      .map((row) => row.playedMinutes as number)
      .reverse();

    // Step 2: fetch playthroughs by libraryEntry.id (dependent read — no N+1).
    if (libraryEntry) {
      playthroughs = await prisma.playthrough.findMany({
        where: { libraryItemId: libraryEntry.id },
        include: { journalEntries: { orderBy: { createdAt: "desc" } } },
        orderBy: { ordinal: "desc" },
      });
    }

    playtimeTotalMinutes = playthroughs.reduce(
      (sum, p) => sum + (p.playtimeMinutes ?? 0),
      0
    );

    // Step 3: fetch unattached (null-playthroughId) entries only when at least
    // one run exists. Per §2.11 the JournalFeed is hidden when there are no runs,
    // so fetching them for a no-run game is wasted work and would mislead callers
    // into thinking the feed should show something.
    if (playthroughs.length > 0) {
      unattachedJournalEntries = await prisma.journalEntry.findMany({
        where: { userId, gameId: game.id, playthroughId: null },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  const derivedStatus = deriveLibraryStatus(
    playthroughs,
    libraryEntry?.status ?? "SHELF"
  );
  const statusIsManual = libraryEntry?.statusIsManual ?? false;
  const hasBeenPlayed = deriveHasBeenPlayed(playthroughs);

  return {
    game,
    igdbDetails,
    libraryEntry,
    journalTeaser,
    journalCount,
    playtimeTotalMinutes,
    playtimeSessionCount,
    recentSessionMinutes,
    playthroughs,
    derivedStatus,
    statusIsManual,
    hasBeenPlayed,
    unattachedJournalEntries,
  };
}
