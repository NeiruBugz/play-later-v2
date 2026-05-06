/**
 * Game-detail orchestrator (Slice 13).
 *
 * Resolves an IGDB slug → cached `Game` row, plus optional viewer-scoped
 * `LibraryItem` and recent `JournalEntry` teaser. `relatedGames` is best-effort
 * and currently returns `[]` — see CLAUDE.md "Intentional divergences (Slice 13)".
 *
 * Throws `NotFoundError` when IGDB returns no match for the slug.
 *
 * No DI, no classes, no Result wrapper — per C2 DAL conventions.
 */
import { getGameBySlug } from "@/shared/api/igdb";
import { prisma } from "@/shared/lib/db";
import { NotFoundError } from "@/shared/lib/errors";

import type {
  Game,
  JournalEntry,
  LibraryItem,
} from "../../../../shared/lib/prisma/client.ts";

import { upsertGameFromIgdbPayload } from "./upsert-game.server";

const JOURNAL_TEASER_LIMIT = 3;

export interface GameDetails {
  game: Game;
  relatedGames: Game[];
  libraryEntry: LibraryItem | null;
  journalTeaser: JournalEntry[];
}

export async function getGameDetails(params: {
  slug: string;
  userId?: string;
}): Promise<GameDetails> {
  const { slug, userId } = params;

  // 1. Resolve via local cache first to avoid an IGDB round-trip on cache hit.
  const cached = await prisma.game.findUnique({ where: { slug } });

  let game: Game;
  if (cached) {
    game = cached;
  } else {
    const remote = await getGameBySlug(slug);
    if (!remote) {
      throw new NotFoundError("Game not found", { slug });
    }
    game = await upsertGameFromIgdbPayload(remote);
  }

  // 2. Viewer-scoped reads — privacy invariant: only the requesting user's rows.
  let libraryEntry: LibraryItem | null = null;
  let journalTeaser: JournalEntry[] = [];

  if (userId) {
    [libraryEntry, journalTeaser] = await Promise.all([
      prisma.libraryItem.findFirst({
        where: { userId, gameId: game.id },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.journalEntry.findMany({
        where: { userId, gameId: game.id },
        orderBy: { createdAt: "desc" },
        take: JOURNAL_TEASER_LIMIT,
      }),
    ]);
  }

  // 3. Related games — deferred (see CLAUDE.md "Intentional divergences (Slice 13)").
  const relatedGames: Game[] = [];

  return { game, relatedGames, libraryEntry, journalTeaser };
}
