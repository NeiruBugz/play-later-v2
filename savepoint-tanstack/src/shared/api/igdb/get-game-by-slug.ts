/**
 * IGDB game-by-slug worker.
 *
 * Mirrors `getGameByIgdbId` shape: empty result → `null`; transport / non-2xx
 * / malformed → `UpstreamError`. Caller decides whether `null` is `NotFoundError`.
 *
 * Slug values originate from URL segments — escape inner quotes and wrap in
 * double quotes per IGDB's apicalypse `where slug = "<value>"` syntax.
 */
import { z } from "zod";

import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

import { igdbContextFromThrown } from "./errors";
import { igdbFetch } from "./fetch";
import { SearchResponseItemSchema, type SearchResponseItem } from "./schemas";

const logger = createLogger({ service: "igdb-get-game-by-slug" });

const GAME_FIELDS = [
  "name",
  "slug",
  "first_release_date",
  "cover.image_id",
  "platforms.name",
] as const;

function escapeSlug(slug: string): string {
  return slug.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function getGameBySlug(
  slug: string
): Promise<SearchResponseItem | null> {
  const query = `fields ${GAME_FIELDS.join(",")}; where slug = "${escapeSlug(slug)}"; limit 1;`;

  let response: unknown;
  try {
    response = await igdbFetch("/games", query);
  } catch (cause) {
    const igdbContext = igdbContextFromThrown(cause);
    logger.error(
      { err: cause, slug, ...igdbContext },
      "IGDB get-game-by-slug transport failure"
    );
    throw new UpstreamError("IGDB get-game-by-slug failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      slug,
      query,
      ...igdbContext,
    });
  }

  const parsed = z.array(SearchResponseItemSchema).safeParse(response);
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.issues, slug },
      "IGDB get-game-by-slug returned malformed response"
    );
    throw new UpstreamError(
      "IGDB get-game-by-slug returned malformed response",
      { slug }
    );
  }

  return parsed.data[0] ?? null;
}
