/**
 * Game-detail orchestrator (Slice 13, refined in Slice 14 phase-2 rework).
 *
 * Phase 1 (this file): DB-only read of the cached `Game` row, plus optional
 * viewer-scoped `LibraryItem` and recent `JournalEntry` teaser. NO IGDB-derived
 * "live" data — collections and times-to-beat moved to deferred phase-2 entity
 * queries (see `get-game-collections.server.ts`, `get-times-to-beat.server.ts`).
 *
 * Throws `NotFoundError` when IGDB returns no match for the slug on cache miss.
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

  // 3. `relatedGames: Game[]` retained for backward compatibility and is empty.
  //    Live related-games surface is the deferred phase-2 stream — see
  //    `getGameCollectionsByIgdbId` + `getRelatedGames`.
  const relatedGames: Game[] = [];

  return { game, relatedGames, libraryEntry, journalTeaser };
}
