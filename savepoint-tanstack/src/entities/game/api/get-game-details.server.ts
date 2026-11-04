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
import { getEndedPlays, type EndedPlay } from "./get-ended-plays.server";
import { upsertThinGameFromIgdbDetailsPayload } from "./upsert-game.server";

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
  /** Ended plays, newest first; the owner's own game only, empty otherwise. */
  history: EndedPlay[];
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
  let history: EndedPlay[] = [];

  if (userId) {
    const [entry, userNotes, endedPlays] = await Promise.all([
      prisma.libraryItem.findUnique({
        where: { userId_gameId: { userId, gameId: game.id } },
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
      getEndedPlays(userId, game.id),
    ]);

    libraryEntry = entry;
    notes = userNotes;
    if (entry) prompts = derivePrompts(entry, userNotes);

    const timedMinutes = userNotes
      .map((note) => note.playedMinutes)
      .filter((minutes): minutes is number => minutes !== null && minutes > 0);
    playtimeSessionCount = timedMinutes.length;
    playtimeTotalMinutes = timedMinutes.reduce((sum, m) => sum + m, 0);
    // Notes are newest→oldest; take the most recent, then reverse so the
    // rhythm chart reads oldest→newest.
    recentSessionMinutes = timedMinutes
      .slice(0, RECENT_SESSION_LIMIT)
      .reverse();
    history = endedPlays;
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
    history,
  };
}
