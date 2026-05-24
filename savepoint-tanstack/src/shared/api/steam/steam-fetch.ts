/**
 * Low-level Steam Web API client.
 *
 * Public surface:
 *   - fetchPlayerSummary(steamId64) — GetPlayerSummaries/v2
 *   - fetchOwnedGames(steamId64)    — GetOwnedGames/v1
 *
 * Error mapping (each function):
 *   - 401 / 403 / other 4xx (not 429)        → UpstreamError (generic — bad key or unknown 4xx)
 *   - 429                                     → SteamRateLimitError
 *   - 5xx / network failure                   → SteamApiUnavailableError
 *   - Zod parse failure                       → UpstreamError (schema drift)
 *   - GetPlayerSummaries: empty players       → SteamProfileNotFoundError
 *   - GetPlayerSummaries: visibility !== 3    → SteamProfilePrivateError
 *   - GetOwnedGames: game_count>0 && no games → SteamProfilePrivateError
 *
 * Uses `globalThis.fetch` so tests can `vi.stubGlobal("fetch", ...)` — same
 * convention as `shared/api/igdb/fetch.ts`.
 */
import { env } from "@env";
import { z } from "zod";

import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

import {
  SteamApiUnavailableError,
  SteamProfileNotFoundError,
  SteamProfilePrivateError,
  SteamRateLimitError,
} from "./errors";

const logger = createLogger({ service: "steam-fetch" });

const STEAM_BASE_URL = "https://api.steampowered.com";

const PlayerSummarySchema = z.object({
  steamid: z.string(),
  personaname: z.string(),
  profileurl: z.string(),
  avatarfull: z.string(),
  communityvisibilitystate: z.number(),
  profilestate: z.number().optional(),
  lastlogoff: z.number().optional(),
  commentpermission: z.number().optional(),
});

const PlayerSummariesResponseSchema = z.object({
  response: z.object({
    players: z.array(PlayerSummarySchema),
  }),
});

const OwnedGameRawSchema = z.object({
  appid: z.number(),
  name: z.string(),
  playtime_forever: z.number(),
  playtime_windows_forever: z.number().optional(),
  playtime_mac_forever: z.number().optional(),
  playtime_linux_forever: z.number().optional(),
  img_icon_url: z.string().optional(),
  img_logo_url: z.string().optional(),
  rtime_last_played: z.number().optional(),
});

const OwnedGamesResponseSchema = z.object({
  response: z.object({
    game_count: z.number().optional(),
    games: z.array(OwnedGameRawSchema).optional(),
  }),
});

export const OwnedGameSchema = z.object({
  appId: z.number(),
  name: z.string(),
  playtimeForever: z.number(),
  playtimeWindows: z.number(),
  playtimeMac: z.number(),
  playtimeLinux: z.number(),
  imgIconUrl: z.string().nullable(),
  imgLogoUrl: z.string().nullable(),
  rtimeLastPlayed: z.number().nullable(),
});

export const PlayerSummarySchemaPublic = z.object({
  steamId64: z.string(),
  displayName: z.string(),
  profileUrl: z.string(),
  avatarUrl: z.string(),
  isPublic: z.boolean(),
});

export type OwnedGame = z.infer<typeof OwnedGameSchema>;
export type PlayerSummary = z.infer<typeof PlayerSummarySchemaPublic>;

/**
 * Map an HTTP non-2xx (or network failure) to the appropriate AppError
 * subclass. Caller passes the resource label for log context.
 */
function throwHttpError(
  resource: string,
  context: Record<string, unknown>,
  status?: number
): never {
  if (status === undefined) {
    logger.error({ resource, ...context }, "Steam network failure");
    throw new SteamApiUnavailableError(undefined, { resource, ...context });
  }
  if (status === 429) {
    logger.warn({ resource, status, ...context }, "Steam rate-limited");
    throw new SteamRateLimitError(undefined, { resource, status, ...context });
  }
  if (status >= 500) {
    logger.error({ resource, status, ...context }, "Steam 5xx");
    throw new SteamApiUnavailableError(undefined, {
      resource,
      status,
      ...context,
    });
  }
  // 4xx (other than 429) — typically bad API key or unknown — bubble as generic
  // UpstreamError so routes treat it as a non-specific upstream failure.
  logger.error({ resource, status, ...context }, "Steam non-2xx");
  throw new UpstreamError(`Steam ${resource} failed: HTTP ${status}`, {
    resource,
    status,
    ...context,
  });
}

async function safeFetch(url: string, resource: string): Promise<Response> {
  try {
    return await fetch(url);
  } catch (err) {
    throwHttpError(resource, { cause: (err as Error)?.message });
  }
}

export async function fetchPlayerSummary(
  steamId64: string
): Promise<PlayerSummary> {
  const resource = "/ISteamUser/GetPlayerSummaries/v2/";
  const url = new URL(`${STEAM_BASE_URL}${resource}`);
  url.searchParams.set("key", env.STEAM_API_KEY);
  url.searchParams.set("steamids", steamId64);

  const res = await safeFetch(url.toString(), resource);
  if (!res.ok) {
    throwHttpError(resource, { steamId64 }, res.status);
  }

  const json = await res.json();
  const parsed = PlayerSummariesResponseSchema.safeParse(json);
  if (!parsed.success) {
    logger.error(
      { resource, steamId64, issues: parsed.error.issues },
      "Steam response schema mismatch"
    );
    throw new UpstreamError("Steam response schema mismatch", {
      resource,
      steamId64,
    });
  }

  const players = parsed.data.response.players;
  if (players.length === 0) {
    throw new SteamProfileNotFoundError(undefined, { steamId64 });
  }

  const player = players[0];
  const isPublic = player.communityvisibilitystate === 3;
  if (!isPublic) {
    throw new SteamProfilePrivateError(undefined, { steamId64 });
  }

  return {
    steamId64: player.steamid,
    displayName: player.personaname,
    profileUrl: player.profileurl,
    avatarUrl: player.avatarfull,
    isPublic,
  };
}

export async function fetchOwnedGames(steamId64: string): Promise<OwnedGame[]> {
  const resource = "/IPlayerService/GetOwnedGames/v1/";
  const url = new URL(`${STEAM_BASE_URL}${resource}`);
  url.searchParams.set("key", env.STEAM_API_KEY);
  url.searchParams.set("steamid", steamId64);
  url.searchParams.set("include_appinfo", "1");
  url.searchParams.set("include_played_free_games", "1");
  url.searchParams.set("include_extended_appinfo", "1");

  const res = await safeFetch(url.toString(), resource);
  if (!res.ok) {
    throwHttpError(resource, { steamId64 }, res.status);
  }

  const json = await res.json();
  const parsed = OwnedGamesResponseSchema.safeParse(json);
  if (!parsed.success) {
    logger.error(
      { resource, steamId64, issues: parsed.error.issues },
      "Steam response schema mismatch"
    );
    throw new UpstreamError("Steam response schema mismatch", {
      resource,
      steamId64,
    });
  }

  const { game_count, games } = parsed.data.response;

  if (!games) {
    // Steam omits the `games` array entirely when the profile is private. A
    // `game_count > 0` with no array is the privacy signal canonical relies on.
    if ((game_count ?? 0) > 0) {
      throw new SteamProfilePrivateError(undefined, { steamId64 });
    }
    return [];
  }

  return games.map((g) => ({
    appId: g.appid,
    name: g.name,
    playtimeForever: g.playtime_forever,
    playtimeWindows: g.playtime_windows_forever ?? 0,
    playtimeMac: g.playtime_mac_forever ?? 0,
    playtimeLinux: g.playtime_linux_forever ?? 0,
    imgIconUrl: g.img_icon_url ?? null,
    imgLogoUrl: g.img_logo_url ?? null,
    rtimeLastPlayed: g.rtime_last_played ?? null,
  }));
}
