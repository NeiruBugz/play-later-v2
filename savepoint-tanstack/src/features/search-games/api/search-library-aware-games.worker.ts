import { z } from "zod";

import {
  getLibraryItemsByIgdbIds,
  type LibraryStateForGame,
} from "@/entities/library-item/api/get-library-items-by-igdb-ids.server";
import { searchGames, type SearchResponseItem } from "@/shared/api/igdb";

export const SEARCH_LIBRARY_AWARE_INPUT = z.object({
  name: z.string().min(1, "Search query is required").max(200),
  offset: z.number().int().nonnegative().optional(),
});

export type SearchLibraryAwareInput = z.infer<
  typeof SEARCH_LIBRARY_AWARE_INPUT
>;

/**
 * A search result annotated with the viewer's library state. `library` is
 * `null` when the viewer doesn't own the game (the card shows an add button)
 * and populated when they do (the card shows status + rating, no add button).
 */
export type LibraryAwareSearchItem = SearchResponseItem & {
  library: LibraryStateForGame | null;
};

export type LibraryAwareSearchResult = {
  games: LibraryAwareSearchItem[];
  count: number;
  /** How many of the returned results are already in the viewer's library. */
  ownedCount: number;
};

/**
 * Searches IGDB, then joins each result with the viewer's `LibraryItem` by
 * `gameId`/`igdbId`. Anonymous viewers (`userId === undefined`) get every
 * result back unowned — search itself needs no auth, only the annotation does.
 */
export async function searchLibraryAwareGamesWorker(
  userId: string | undefined,
  data: unknown
): Promise<LibraryAwareSearchResult> {
  const parsed = SEARCH_LIBRARY_AWARE_INPUT.parse(data);
  const { games, count } = await searchGames({
    name: parsed.name,
    offset: parsed.offset,
  });

  if (userId === undefined || games.length === 0) {
    return {
      games: games.map((game) => ({ ...game, library: null })),
      count,
      ownedCount: 0,
    };
  }

  const libraryByIgdbId = await getLibraryItemsByIgdbIds(
    userId,
    games.map((game) => game.id)
  );

  let ownedCount = 0;
  const annotated = games.map((game) => {
    const library = libraryByIgdbId.get(game.id) ?? null;
    if (library !== null) ownedCount += 1;
    return { ...game, library };
  });

  return { games: annotated, count, ownedCount };
}
