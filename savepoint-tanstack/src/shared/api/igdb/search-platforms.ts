/**
 * IGDB platform-search worker.
 *
 * Searches IGDB's `/platforms` catalog by name and returns the canonical
 * platform names (relevance-ordered, deduped). Mirrors the auth/headers shape
 * of `searchGames` / `getGameByIgdbId` (uses `igdbFetch` → token cache + bearer
 * header).
 *
 * Behavior:
 *   - Empty trimmed query → returns `[]` WITHOUT calling IGDB.
 *   - Schema validation failure → `UpstreamError`.
 *   - Transport / non-2xx → `UpstreamError` (wraps the plain Error from
 *     `igdbFetch`).
 *   - Order is preserved as IGDB returns it (match relevance) — never sorted
 *     alphabetically.
 */
import { z } from "zod";

import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

import { igdbContextFromThrown } from "./errors";
import { igdbFetch } from "./fetch";

const logger = createLogger({ service: "igdb-search-platforms" });

const PlatformNameItemSchema = z.object({ name: z.string() });

const PLATFORM_SEARCH_LIMIT = 8;

export async function searchIgdbPlatforms(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed === "") return [];

  const escaped = trimmed.replace(/"/g, "");
  const igdbQuery = `search "${escaped}"; fields name; limit ${PLATFORM_SEARCH_LIMIT};`;

  let response: unknown;
  try {
    response = await igdbFetch("/platforms", igdbQuery);
  } catch (cause) {
    const igdbContext = igdbContextFromThrown(cause);
    logger.error(
      { err: cause, searchQuery: trimmed, ...igdbContext },
      "IGDB platform-search transport failure"
    );
    throw new UpstreamError("IGDB platform search failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      searchQuery: trimmed,
      query: igdbQuery,
      ...igdbContext,
    });
  }

  const parsed = z.array(PlatformNameItemSchema.partial()).safeParse(response);
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.issues, searchQuery: trimmed },
      "IGDB platform search returned malformed response"
    );
    throw new UpstreamError(
      "IGDB platform search returned malformed response",
      {
        searchQuery: trimmed,
      }
    );
  }

  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of parsed.data) {
    if (typeof item.name !== "string") continue;
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    names.push(item.name);
  }
  return names;
}
