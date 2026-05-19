/**
 * Game-detail orchestrator — canonical-aligned dual-track shape.
 *
 * Returns both:
 *   - `game`: thin cached `Game` row from Postgres (for cross-feature lookups
 *     like `libraryItem.gameId`). Title/slug/cover/releaseDate only.
 *   - `igdbDetails`: live rich IGDB payload (summary, genres, platforms,
 *     screenshots, companies, themes, rating, franchise). NOT persisted.
 *
 * The widget reads display data from `igdbDetails`; the Game row exists only
 * to anchor cross-feature reads. This mirrors
 * `savepoint-app/features/game-detail/use-cases/get-game-details.ts`.
 *
 * Throws `NotFoundError` when IGDB returns no match for the slug.
 *
 * Caching: deliberately NOT cached here. TanStack Start's route loader cache
 * + the React `cache()` wrapper at the route level handle revalidation. The
 * canonical app uses Next 16's `"use cache"` directive for the same purpose.
 */
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

export interface GameDetails {
  game: Game;
  igdbDetails: GameDetailsResponseItem;
  relatedGames: Game[];
  libraryEntry: LibraryItem | null;
  journalTeaser: JournalEntry[];
}

export async function getGameDetails(params: {
  slug: string;
  userId?: string;
}): Promise<GameDetails> {
  const { slug, userId } = params;

  // 1. Live IGDB fetch — source of truth for all rich detail fields. The
  //    widget reads summary / genres / platforms / screenshots / etc.
  //    directly from this payload, never from the cached Game row.
  const igdbDetails = await getGameDetailsFromIgdb(slug);
  if (!igdbDetails) {
    throw new NotFoundError("Game not found", { slug });
  }

  // 2. Thin Game-row upsert — caches just enough to give cross-feature reads
  //    (libraryItem.gameId, journalEntry.gameId) something to anchor on.
  const game = await upsertThinGameFromIgdbDetailsPayload(igdbDetails);

  // 3. Viewer-scoped reads — privacy invariant: only the requesting user's rows.
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

  // 4. `relatedGames: Game[]` retained for backward compatibility and is empty.
  //    Live related-games surface is the deferred phase-2 stream — see
  //    `getGameCollectionsByIgdbId` + `getRelatedGames`.
  const relatedGames: Game[] = [];

  return { game, igdbDetails, relatedGames, libraryEntry, journalTeaser };
}
