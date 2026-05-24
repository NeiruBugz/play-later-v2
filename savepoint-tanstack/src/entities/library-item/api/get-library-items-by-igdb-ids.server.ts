import { prisma } from "@/shared/lib/db.server";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

export type LibraryStateForGame = {
  status: LibraryItemStatus;
  /** 1–10 storage int, or null when unrated. Stars conversion happens in UI. */
  rating: number | null;
};

export type LibraryStateByIgdbId = Map<number, LibraryStateForGame>;

/**
 * Batch-resolves the viewer's library state for a set of IGDB ids — the join
 * that makes search results "library-aware". Returns a Map keyed by `igdbId`
 * so callers can annotate each result in O(1). Games the viewer doesn't own
 * are simply absent from the Map.
 *
 * Server-only (consumed by the search worker); never crosses the wire as a
 * Map, so serialization is a non-issue.
 */
export async function getLibraryItemsByIgdbIds(
  userId: string,
  igdbIds: number[]
): Promise<LibraryStateByIgdbId> {
  const result: LibraryStateByIgdbId = new Map();
  if (igdbIds.length === 0) return result;

  const rows = await prisma.libraryItem.findMany({
    where: { userId, game: { igdbId: { in: igdbIds } } },
    select: {
      status: true,
      rating: true,
      game: { select: { igdbId: true } },
    },
  });

  for (const row of rows) {
    result.set(row.game.igdbId, { status: row.status, rating: row.rating });
  }
  return result;
}
