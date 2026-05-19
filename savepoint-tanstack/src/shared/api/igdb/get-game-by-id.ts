/**
 * IGDB game-by-id worker.
 *
 * Fetches a single IGDB game by its numeric `id`. Mirrors the auth/headers
 * shape of `searchGames` (uses `igdbFetch` → token cache + bearer header).
 *
 * Behavior:
 *   - Empty result array → returns `null` (caller decides whether that is
 *     `NotFoundError` vs an acceptable "not in IGDB").
 *   - Schema validation failure → `UpstreamError`.
 *   - Transport / non-2xx → `UpstreamError` (wraps the plain Error from
 *     `igdbFetch`).
 */
import { z } from "zod";

import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

import { igdbContextFromThrown } from "./errors";
import { igdbFetch } from "./fetch";
import { SearchResponseItemSchema, type SearchResponseItem } from "./schemas";

const logger = createLogger({ service: "igdb-get-game-by-id" });

const GAME_FIELDS = [
  "name",
  "slug",
  "first_release_date",
  "cover.image_id",
  "platforms.name",
] as const;

export async function getGameByIgdbId(
  igdbId: number
): Promise<SearchResponseItem | null> {
  const query = `fields ${GAME_FIELDS.join(",")}; where id = ${igdbId}; limit 1;`;

  let response: unknown;
  try {
    response = await igdbFetch("/games", query);
  } catch (cause) {
    const igdbContext = igdbContextFromThrown(cause);
    logger.error(
      { err: cause, igdbId, ...igdbContext },
      "IGDB get-game-by-id transport failure"
    );
    throw new UpstreamError("IGDB get-game-by-id failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      igdbId,
      query,
      ...igdbContext,
    });
  }

  const parsed = z.array(SearchResponseItemSchema).safeParse(response);
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.issues, igdbId },
      "IGDB get-game-by-id returned malformed response"
    );
    throw new UpstreamError("IGDB get-game-by-id returned malformed response", {
      igdbId,
    });
  }

  return parsed.data[0] ?? null;
}
