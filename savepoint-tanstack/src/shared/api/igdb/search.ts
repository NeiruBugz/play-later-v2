/**
 * IGDB game-search worker.
 *
 * Behavioral simplification vs canonical `IgdbService.searchGamesByName`:
 *   - Empty result → `{ games: [], count: 0 }` (canonical throws `NotFoundError`).
 *   - Schema-validation failure → `UpstreamError` (canonical returns `undefined`
 *     from a swallowed safeParse and then throws `NotFoundError`).
 *   - No name normalization (canonical applies `normalizeGameTitle` /
 *     `normalizeString`). Add only if a search-quality bug surfaces.
 *   - No retry, no rate limiter, no 401 token-refresh dance.
 */
import { z } from "zod";

import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

import { igdbContextFromThrown } from "./errors";
import { igdbFetch } from "./fetch";
import { buildGameSearchQuery, buildSearchFilterConditions } from "./queries";
import { SearchResponseItemSchema, type SearchResponseItem } from "./schemas";

const logger = createLogger({ service: "igdb-search" });

export interface SearchGamesParams {
  name: string;
  offset?: number;
  fields?: Record<string, string | undefined>;
}

export interface SearchGamesResult {
  games: SearchResponseItem[];
  count: number;
}

export async function searchGames(
  params: SearchGamesParams
): Promise<SearchGamesResult> {
  const filterConditions = buildSearchFilterConditions(params.fields ?? {});
  const query = buildGameSearchQuery({
    searchQuery: params.name,
    filterConditions,
    offset: params.offset,
  });

  let response: unknown;
  try {
    response = await igdbFetch("/games", query);
  } catch (cause) {
    const igdbContext = igdbContextFromThrown(cause);
    logger.error(
      { err: cause, searchQuery: params.name, ...igdbContext },
      "IGDB search transport failure"
    );
    throw new UpstreamError("IGDB search failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      searchQuery: params.name,
      query,
      ...igdbContext,
    });
  }

  const parsed = z.array(SearchResponseItemSchema).safeParse(response);
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.issues, searchQuery: params.name },
      "IGDB search returned malformed response"
    );
    throw new UpstreamError("IGDB search returned malformed response", {
      searchQuery: params.name,
    });
  }

  return { games: parsed.data, count: parsed.data.length };
}
