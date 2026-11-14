import { z } from "zod";

import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

import { igdbContextFromThrown } from "./errors";
import { igdbFetch } from "./fetch";
import { SearchResponseItemSchema, type SearchResponseItem } from "./schemas";

const logger = createLogger({ service: "igdb-match-steam-games" });

const STEAM_EXTERNAL_GAME_SOURCE_ID = 1;
const MAIN_GAME_TYPE = 0;
const MAX_EXTERNAL_GAME_ROWS = 500;

const EXTERNAL_GAME_FIELDS = [
  "uid",
  "game.id",
  "game.name",
  "game.slug",
  "game.first_release_date",
  "game.cover.image_id",
  "game.game_type",
  "game.release_dates.date",
  "game.release_dates.date_format",
  "game.release_dates.y",
  "game.release_dates.m",
  "game.release_dates.human",
].join(", ");

const ExternalGameRowSchema = z.object({
  uid: z.string(),
  game: SearchResponseItemSchema.optional(),
});

const ResponseSchema = z.array(ExternalGameRowSchema);

function gameTypeOf(game: SearchResponseItem): number | undefined {
  return typeof game.game_type === "object"
    ? game.game_type.id
    : game.game_type;
}

function isPreferredOver(
  candidate: SearchResponseItem,
  current: SearchResponseItem
): boolean {
  const candidateIsMain = gameTypeOf(candidate) === MAIN_GAME_TYPE;
  const currentIsMain = gameTypeOf(current) === MAIN_GAME_TYPE;
  if (candidateIsMain !== currentIsMain) return candidateIsMain;
  return candidate.id < current.id;
}

/**
 * Resolve many Steam app ids to IGDB games with ONE `/external_games` request
 * (`external_game_source = 1` is Steam). Unfound ids, and ids IGDB knows but
 * has no game for, are absent from the returned map. When several games share
 * an app id the main game wins, then the lowest IGDB id.
 */
export async function matchSteamGamesByAppIds(
  appIds: string[]
): Promise<Map<string, SearchResponseItem>> {
  const matches = new Map<string, SearchResponseItem>();
  if (appIds.length === 0) return matches;

  const invalid = appIds.find((id) => !/^\d+$/.test(id));
  if (invalid !== undefined) {
    throw new Error(`matchSteamGamesByAppIds: invalid steamAppId "${invalid}"`);
  }

  const quotedUids = appIds.map((id) => `"${id}"`).join(",");
  const query = `
    fields ${EXTERNAL_GAME_FIELDS};
    where external_game_source = ${STEAM_EXTERNAL_GAME_SOURCE_ID} & uid = (${quotedUids});
    limit ${MAX_EXTERNAL_GAME_ROWS};
  `;

  let response: unknown;
  try {
    response = await igdbFetch("/external_games", query);
  } catch (cause) {
    const igdbContext = igdbContextFromThrown(cause);
    logger.error(
      { err: cause, requested: appIds.length, ...igdbContext },
      "IGDB Steam batch match transport failure"
    );
    throw new UpstreamError("IGDB Steam batch match failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      requested: appIds.length,
      ...igdbContext,
    });
  }

  const parsed = ResponseSchema.safeParse(response);
  if (!parsed.success) {
    logger.error(
      { requested: appIds.length, issues: parsed.error.issues },
      "IGDB Steam batch match response failed schema validation"
    );
    throw new UpstreamError("Invalid IGDB response for Steam batch match", {
      requested: appIds.length,
    });
  }

  for (const { uid, game } of parsed.data) {
    if (!game) continue;
    const current = matches.get(uid);
    if (!current || isPreferredOver(game, current)) matches.set(uid, game);
  }
  return matches;
}
