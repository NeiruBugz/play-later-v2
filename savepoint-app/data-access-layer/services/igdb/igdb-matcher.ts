import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import {
  __resetTokenCacheForTests,
  igdbFetch,
  IgdbRateLimitError,
} from "@/shared/lib/igdb";
import type { FullGameInfoResponse } from "@/shared/types";

import { ServiceErrorCode, type ServiceResult } from "../types";
import { FullGameInfoResponseSchema } from "./schemas";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "IgdbMatcher" });

const STEAM_STORE_URL = "https://store.steampowered.com/app";

const MatchSteamGameSchema = z.object({
  steamAppId: z
    .string()
    .min(1, "Steam App ID is required")
    .regex(/^\d+$/, "Steam App ID must contain only digits"),
});

export type MatchSteamGameParams = z.infer<typeof MatchSteamGameSchema>;

export interface MatchSteamGameResult {
  game: FullGameInfoResponse | null;
}

export function resetTokenCache(): void {
  __resetTokenCacheForTests();
}

/**
 * Match a Steam game to IGDB using Steam App ID lookup.
 * Uses IGDB's external_games table which has Steam Store URL mappings.
 *
 * @param params - Steam App ID to match
 * @returns ServiceResult with matched IGDB game or null if not found
 *
 * @example
 * ```ts
 * const result = await matchSteamGameToIgdb({ steamAppId: "570" });
 * if (result.success && result.data.game) {
 *   console.log(`Matched: ${result.data.game.name}`);
 * }
 * ```
 */
export async function matchSteamGameToIgdb(
  params: MatchSteamGameParams
): Promise<ServiceResult<MatchSteamGameResult>> {
  const validation = MatchSteamGameSchema.safeParse(params);
  if (!validation.success) {
    logger.warn(
      { errors: validation.error.issues, steamAppId: params.steamAppId },
      "Steam App ID validation failed"
    );
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid Steam App ID",
      code: ServiceErrorCode.VALIDATION_ERROR,
    };
  }

  const { steamAppId } = validation.data;

  try {
    logger.info({ steamAppId }, "Matching Steam game to IGDB");

    const steamUrl = `${STEAM_STORE_URL}/${steamAppId}`;

    const query = `
      fields id, name, slug, summary, cover.image_id, first_release_date,
             release_dates.platform.name, release_dates.human,
             aggregated_rating, genres.name, platforms.name, platforms.slug,
             platforms.abbreviation, screenshots.image_id,
             involved_companies.developer, involved_companies.publisher,
             involved_companies.company.name, game_modes.name,
             game_engines.name, player_perspectives.name;
      where external_games.url = "${steamUrl}";
      limit 1;
    `;

    const response = await igdbFetch<unknown[]>("/games", query);

    const result = z.array(FullGameInfoResponseSchema).safeParse(response);

    if (!result.success) {
      logger.error(
        { errors: result.error.issues, steamAppId },
        "IGDB response validation failed for Steam matching"
      );
      return {
        success: false,
        error: "Invalid response from IGDB",
        code: ServiceErrorCode.EXTERNAL_SERVICE_ERROR,
      };
    }

    if (result.data.length === 0) {
      logger.info(
        { steamAppId, steamUrl },
        "No IGDB match found for Steam App ID"
      );
      return {
        success: true,
        data: { game: null },
      };
    }

    const game = result.data[0];
    logger.info(
      { steamAppId, igdbId: game.id, gameName: game.name },
      "Successfully matched Steam game to IGDB"
    );

    return {
      success: true,
      data: { game },
    };
  } catch (error) {
    logger.error({ error, steamAppId }, "Error matching Steam game to IGDB");

    if (error instanceof IgdbRateLimitError) {
      return {
        success: false,
        error: "IGDB rate limit exceeded. Please try again later.",
        code: ServiceErrorCode.IGDB_RATE_LIMITED,
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to match Steam game to IGDB",
      code: ServiceErrorCode.EXTERNAL_SERVICE_ERROR,
    };
  }
}
