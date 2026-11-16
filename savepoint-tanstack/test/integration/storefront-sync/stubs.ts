/**
 * Shared edge stubs for the storefront-sync integration tests.
 *
 *   - Steam is stubbed at the HTTP edge (`fetch` -> GetOwnedGames).
 *   - IGDB is stubbed at `src/shared/api/igdb/fetch.ts` (`igdbFetch`): each test
 *     file declares `vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }))`
 *     and points the mock at `externalGamesResponder(...)`.
 */
import { vi } from "vitest";

export const STEAM_ID_64 = "76561198012345678";

export interface RawSteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  rtime_last_played?: number;
}

export const THREE_GAMES: RawSteamGame[] = [
  { appid: 730, name: "Counter-Strike 2", playtime_forever: 1200 },
  { appid: 440, name: "Team Fortress 2", playtime_forever: 0 },
  { appid: 570, name: "Dota 2", playtime_forever: 600 },
];

export function makeOwnedGames(
  count: number,
  firstAppId = 1000
): RawSteamGame[] {
  return Array.from({ length: count }, (_unused, index) => ({
    appid: firstAppId + index,
    name: `Owned Game ${firstAppId + index}`,
    playtime_forever: 0,
  }));
}

/**
 * Stubs Steam GetOwnedGames. With `hold`, the response waits for `release()`,
 * which keeps the job active (GATHERING) so "second start" is deterministic.
 */
export function stubSteam(
  games: RawSteamGame[],
  options: { hold?: boolean } = {}
) {
  let release: () => void = () => {};
  const gate = options.hold
    ? new Promise<void>((resolve) => {
        release = resolve;
      })
    : Promise.resolve();
  const fetchMock = vi.fn(async (url: string) => {
    if (!url.includes("GetOwnedGames")) {
      throw new Error(`Unexpected Steam endpoint: ${url}`);
    }
    await gate;
    return new Response(
      JSON.stringify({ response: { game_count: games.length, games } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return { release, fetchMock };
}

/**
 * Stubs Steam GetOwnedGames with a raw JSON body, for the shapes `stubSteam`
 * cannot produce: a private profile (`{ response: {} }`, or `game_count > 0`
 * with no `games` array).
 */
export function stubSteamBody(body: unknown) {
  const fetchMock = vi.fn(async (url: string) => {
    if (!url.includes("GetOwnedGames")) {
      throw new Error(`Unexpected Steam endpoint: ${url}`);
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock };
}

/** Stubs Steam GetOwnedGames answering with a non-2xx HTTP status (429, 503, ...). */
export function stubSteamHttpStatus(status: number) {
  const fetchMock = vi.fn(async (url: string) => {
    if (!url.includes("GetOwnedGames")) {
      throw new Error(`Unexpected Steam endpoint: ${url}`);
    }
    return new Response("", { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock };
}

/** Stubs Steam GetOwnedGames failing at the network level (no response at all). */
export function stubSteamNetworkFailure() {
  const fetchMock = vi.fn(async () => {
    throw new TypeError("fetch failed");
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock };
}

/** An IGDB `game` object as returned inside an `/external_games` row. */
export interface IgdbCatalogueGame {
  id: number;
  name: string;
  slug: string;
  first_release_date?: number;
  cover?: { image_id: string };
  game_type?: number;
}

/**
 * Responder for the mocked `igdbFetch`, keyed by Steam app id:
 *   - a game      -> an `/external_games` row `{ uid, game }`
 *   - `null`      -> a row WITHOUT `game` (IGDB knows the uid, not the game)
 *   - absent key  -> no row at all
 * Only rows for the uids the query actually asked for are returned.
 */
export function externalGamesResponder(
  catalogue: Record<string, IgdbCatalogueGame | null>
) {
  return async (resource: string, query: string): Promise<unknown> => {
    if (resource !== "/external_games") {
      throw new Error(`Unexpected IGDB resource: ${resource}`);
    }
    return requestedSteamAppIds(query)
      .filter((uid) => uid in catalogue)
      .map((uid) => {
        const game = catalogue[uid];
        return game === null ? { uid } : { uid, game };
      });
  };
}

/** The quoted uids of an `/external_games` query: `uid = ("440","570")`. */
export function requestedSteamAppIds(query: string): string[] {
  const uidList = /uid = \(([^)]*)\)/.exec(query)?.[1] ?? "";
  return [...uidList.matchAll(/"([^"]*)"/g)].map((match) => match[1] ?? "");
}

const SECONDS_PER_DAY = 24 * 60 * 60;

/** Steam's `rtime_last_played` (unix seconds) for a game last played `days` ago. */
export function steamLastPlayedDaysAgo(days: number): number {
  return Math.floor(Date.now() / 1000) - days * SECONDS_PER_DAY;
}
