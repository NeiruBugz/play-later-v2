import {
  getGameDetailsFromIgdb,
  type GameDetailsResponseItem,
} from "@/shared/api/igdb";
import type { CoverTint } from "@/shared/lib/cover-tint";
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type {
  Game,
  JournalEntry,
  LibraryItem,
} from "../../../../shared/lib/prisma/client.ts";
import { ensureGameEnrichment } from "./ensure-game-enrichment.server";
import { getEndedPlays, type EndedPlay } from "./get-ended-plays.server";
import { upsertThinGameFromIgdbDetailsPayload } from "./upsert-game.server";

export type GameDetailsNote = Pick<
  JournalEntry,
  "id" | "content" | "playedMinutes" | "createdAt" | "prompt"
>;

export type GameDetailsPrompts = { why: boolean; stayed: boolean };

const ENRICHMENT_CAP_MS = 1_500;

async function enrichWithinCap(game: Game) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const capReached = new Promise<typeof game>((resolve) => {
    timer = setTimeout(() => resolve(game), ENRICHMENT_CAP_MS);
  });
  try {
    return await Promise.race([ensureGameEnrichment(game), capReached]);
  } finally {
    clearTimeout(timer);
  }
}

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
  /** Ended plays, newest first; the owner's own game only, empty otherwise. */
  history: EndedPlay[];
  timeToCreditsSeconds: Game["timeToCreditsSeconds"];
  timeToCompleteSeconds: Game["timeToCompleteSeconds"];
  coverTint?: CoverTint | null;
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
  const enrichment = await enrichWithinCap(game);

  let libraryEntry: LibraryItem | null = null;
  let notes: GameDetailsNote[] = [];
  let prompts = NO_PROMPTS;
  let playtimeTotalMinutes = 0;
  let playtimeSessionCount = 0;
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
    history,
    timeToCreditsSeconds: enrichment.timeToCreditsSeconds,
    timeToCompleteSeconds: enrichment.timeToCompleteSeconds,
    coverTint:
      enrichment.coverHue !== null && enrichment.coverChroma !== null
        ? { hue: enrichment.coverHue, chroma: enrichment.coverChroma }
        : null,
  };
}
