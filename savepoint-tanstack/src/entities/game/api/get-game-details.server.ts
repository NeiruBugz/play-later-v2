import {
  getGameDetailsFromIgdb,
  type GameDetailsResponseItem,
} from "@/shared/api/igdb";
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type {
  Game,
  JournalEntry,
  LibraryItem,
} from "../../../../shared/lib/prisma/client.ts";
import { upsertThinGameFromIgdbDetailsPayload } from "./upsert-game.server";

const JOURNAL_TEASER_LIMIT = 3;
const RECENT_SESSION_LIMIT = 9;

export interface GameDetails {
  game: Game;
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

  if (userId) {
    const [entry, teaser, count, playtimeAggregate, recentMinutesRows] =
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
          where: { userId, gameId: game.id },
          _sum: { playedMinutes: true },
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
    playtimeTotalMinutes = playtimeAggregate._sum.playedMinutes ?? 0;
    playtimeSessionCount = playtimeAggregate._count.playedMinutes;
    // Fetched newest→oldest for the "most recent" bound; reverse to oldest→newest
    // so the rhythm chart reads left-to-right.
    recentSessionMinutes = recentMinutesRows
      .map((row) => row.playedMinutes as number)
      .reverse();
  }

  return {
    game,
    igdbDetails,
    libraryEntry,
    journalTeaser,
    journalCount,
    playtimeTotalMinutes,
    playtimeSessionCount,
    recentSessionMinutes,
  };
}
