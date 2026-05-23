import { createServerFn } from "@tanstack/react-start";

import type { PaginatedImportedGames } from "@/entities/imported-game/model/types";
import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  FETCH_STEAM_GAMES_INPUT,
  fetchSteamGamesWorker,
} from "./fetch-steam-games.worker";

/**
 * Server-fn wrapper for the imported-games read.
 *
 * Optional input (Phase D follow-up):
 *   `{ includeIgnored?, search?, playtimeStatus?, playtimeRange?,
 *      platform?, lastPlayed?, sortBy? }` — all forwarded to the worker.
 * NO `.server.ts` suffix per foot-gun #1.
 */
export const fetchSteamGamesFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => FETCH_STEAM_GAMES_INPUT.parse(data))
  .handler(async ({ data }): Promise<PaginatedImportedGames> => {
    const parsed = FETCH_STEAM_GAMES_INPUT.parse(data);
    const userId = await requireUserId();
    return fetchSteamGamesWorker(userId, parsed);
  });
