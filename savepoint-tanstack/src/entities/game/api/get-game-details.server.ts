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
  Playthrough,
} from "../../../../shared/lib/prisma/client.ts";
import { upsertThinGameFromIgdbDetailsPayload } from "./upsert-game.server";

type PlaythroughWithEntries = Playthrough & { journalEntries: JournalEntry[] };

const RECENT_SESSION_LIMIT = 9;

export type GameDetailsNote = Pick<
  JournalEntry,
  "id" | "content" | "playedMinutes" | "createdAt" | "prompt"
>;

export type GameDetailsPrompts = { why: boolean; stayed: boolean };

const NO_PROMPTS: GameDetailsPrompts = { why: false, stayed: false };

export function derivePrompts(
  entry: Pick<
    LibraryItem,
    | "status"
    | "statusChangedAt"
    | "whyPromptDismissedAt"
    | "stayedPromptDismissedAt"
  >,
  notes: Array<Pick<GameDetailsNote, "prompt" | "createdAt">>
): GameDetailsPrompts {
  if (entry.status === "WANT") {
    return {
      why:
        !entry.whyPromptDismissedAt &&
        !notes.some((note) => note.prompt === "WHY"),
      stayed: false,
    };
  }
  if (entry.status === "DONE") {
    const since = entry.statusChangedAt ?? new Date(0);
    const dismissedSince =
      entry.stayedPromptDismissedAt !== null &&
      entry.stayedPromptDismissedAt >= since;
    const answeredSince = notes.some(
      (note) => note.prompt === "STAYED" && note.createdAt >= since
    );
    return { why: false, stayed: !dismissedSince && !answeredSince };
  }
  return NO_PROMPTS;
}

export interface GameDetails {
  game: Game;
  igdbDetails: GameDetailsResponseItem;
  libraryEntry: LibraryItem | null;
  /** How a Done game ended; the owner's own game only, null for everyone else. */
  doneOutcome: LibraryItem["doneOutcome"];
  /** Which optional prompts to offer; both false unless the viewer owns the item. */
  prompts: GameDetailsPrompts;
  /** The viewer's notes for this game, newest first; empty for anonymous viewers. */
  notes: GameDetailsNote[];
  /** Time played: sum of the viewer's notes' playedMinutes for this game; 0 when none. */
  playtimeTotalMinutes: number;
  /** Sessions: count of the viewer's notes with playedMinutes > 0 — the denominator for average session length. */
  playtimeSessionCount: number;
  /** Recent non-null playedMinutes, oldest→newest, bounded for a rhythm chart. */
  recentSessionMinutes: number[];
  playthroughs: PlaythroughWithEntries[];
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
  let notes: GameDetailsNote[] = [];
  let prompts = NO_PROMPTS;
  let playtimeTotalMinutes = 0;
  let playtimeSessionCount = 0;
  let recentSessionMinutes: number[] = [];
  let playthroughs: PlaythroughWithEntries[] = [];

  if (userId) {
    // Step 1: fetch library entry + journal aggregates in parallel.
    // Playthrough query depends on libraryEntry.id so it must come after.
    const [entry, userNotes, sessionAggregate, recentMinutesRows] =
      await Promise.all([
        prisma.libraryItem.findFirst({
          where: { userId, gameId: game.id },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.journalEntry.findMany({
          where: { userId, gameId: game.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            playedMinutes: true,
            createdAt: true,
            prompt: true,
          },
        }),
        prisma.journalEntry.aggregate({
          where: { userId, gameId: game.id, playedMinutes: { gt: 0 } },
          _count: { playedMinutes: true },
          _sum: { playedMinutes: true },
        }),
        prisma.journalEntry.findMany({
          where: { userId, gameId: game.id, playedMinutes: { gt: 0 } },
          orderBy: { createdAt: "desc" },
          take: RECENT_SESSION_LIMIT,
          select: { playedMinutes: true },
        }),
      ]);

    libraryEntry = entry;
    notes = userNotes;
    if (entry) prompts = derivePrompts(entry, userNotes);
    playtimeSessionCount = sessionAggregate._count.playedMinutes;
    playtimeTotalMinutes = sessionAggregate._sum.playedMinutes ?? 0;
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
  }

  return {
    game,
    igdbDetails,
    libraryEntry,
    doneOutcome: libraryEntry?.doneOutcome ?? null,
    prompts,
    notes,
    playtimeTotalMinutes,
    playtimeSessionCount,
    recentSessionMinutes,
    playthroughs,
  };
}
