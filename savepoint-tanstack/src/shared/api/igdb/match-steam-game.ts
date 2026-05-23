/**
 * IGDB Steam-app-id matcher.
 *
 * Resolves a Steam App ID to an IGDB game via IGDB's `external_games`
 * cross-reference (Steam URL → IGDB game). Mirrors canonical
 * `savepoint-app/data-access-layer/services/igdb/igdb-matcher.ts` but
 * tightened to the throw-on-error `AppError` taxonomy.
 *
 * Returns `null` (not throws) when IGDB has no record for the Steam app —
 * "no match" is a legitimate outcome the caller branches on, not an error.
 */
import { z } from "zod";

import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

import { igdbContextFromThrown } from "./errors";
import { igdbFetch } from "./fetch";
import { SearchResponseItemSchema, type SearchResponseItem } from "./schemas";

const logger = createLogger({ service: "igdb-match-steam" });

const STEAM_STORE_URL_BASE = "https://store.steampowered.com/app";

const ResponseSchema = z.array(SearchResponseItemSchema);

export async function matchSteamGameByAppId(
  steamAppId: string
): Promise<SearchResponseItem | null> {
  if (!/^\d+$/.test(steamAppId)) {
    // Caller violation, not an upstream issue — bubble as a programmer error.
    throw new Error(
      `matchSteamGameByAppId: invalid steamAppId "${steamAppId}"`
    );
  }

  const steamUrl = `${STEAM_STORE_URL_BASE}/${steamAppId}`;
  const query = `
    fields id, name, slug, cover.image_id, first_release_date,
           platforms.name, platforms.abbreviation;
    where external_games.url = "${steamUrl}";
    limit 1;
  `;

  let response: unknown;
  try {
    response = await igdbFetch("/games", query);
  } catch (cause) {
    const igdbContext = igdbContextFromThrown(cause);
    logger.error(
      { err: cause, steamAppId, ...igdbContext },
      "IGDB Steam-match transport failure"
    );
    throw new UpstreamError("IGDB Steam-match failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      steamAppId,
      ...igdbContext,
    });
  }

  const parsed = ResponseSchema.safeParse(response);
  if (!parsed.success) {
    logger.error(
      { steamAppId, issues: parsed.error.issues },
      "IGDB Steam-match response failed schema validation"
    );
    throw new UpstreamError("Invalid IGDB response for Steam match", {
      steamAppId,
    });
  }

  if (parsed.data.length === 0) {
    return null;
  }
  return parsed.data[0] ?? null;
}
