import { z } from "zod";

import { findImportedGamesForUser } from "@/entities/imported-game/api/find-imported-games-for-user.server";
import type { PaginatedImportedGames } from "@/entities/imported-game/model/types";
import { UnauthorizedError } from "@/shared/lib/errors";

/**
 * Worker for `fetchSteamGamesFn` (Slice 21 Phase C — imported-games read).
 *
 * Read-side composition: returns the user's imported games. Distinct from
 * `importSteamLibraryWorker`, which talks to the Steam Web API to write new
 * rows; this worker reads what's already been imported. Phase D's
 * `/steam/games` route loader calls this.
 *
 * Phase D follow-up: filter / sort / search inputs are threaded through to
 * `findImportedGamesForUser`. All are optional; the entity query owns the
 * defaults so the worker just forwards what arrived from the route loader.
 */
export const FETCH_STEAM_GAMES_INPUT = z
  .object({
    includeIgnored: z.boolean().optional(),
    includeMatched: z.boolean().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    playtimeStatus: z.enum(["all", "played", "never_played"]).optional(),
    playtimeRange: z
      .enum(["all", "under_1h", "1_to_10h", "10_to_50h", "over_50h"])
      .optional(),
    platform: z.enum(["all", "windows", "mac", "linux"]).optional(),
    lastPlayed: z
      .enum(["all", "30_days", "1_year", "over_1_year", "never"])
      .optional(),
    sortBy: z
      .enum([
        "added_desc",
        "name_asc",
        "name_desc",
        "playtime_desc",
        "playtime_asc",
        "last_played_desc",
        "last_played_asc",
      ])
      .optional(),
  })
  .optional();

export type FetchSteamGamesInput = z.infer<typeof FETCH_STEAM_GAMES_INPUT>;

export async function fetchSteamGamesWorker(
  userId: string | undefined,
  options: FetchSteamGamesInput = undefined
): Promise<PaginatedImportedGames> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }
  const parsed = FETCH_STEAM_GAMES_INPUT.parse(options);
  return findImportedGamesForUser(userId, {
    includeIgnored: parsed?.includeIgnored ?? false,
    includeMatched: parsed?.includeMatched ?? false,
    page: parsed?.page,
    limit: parsed?.limit,
    search: parsed?.search,
    playtimeStatus: parsed?.playtimeStatus,
    playtimeRange: parsed?.playtimeRange,
    platform: parsed?.platform,
    lastPlayed: parsed?.lastPlayed,
    sortBy: parsed?.sortBy,
  });
}
