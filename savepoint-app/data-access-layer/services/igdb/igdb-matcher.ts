import { env } from "@/env.mjs";
import { z } from "zod";

import { API_URL, TOKEN_URL } from "@/shared/config/igdb";
import { TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS } from "@/shared/constants";
import { createLogger, getTimeStamp, LOGGER_CONTEXT } from "@/shared/lib";
import type {
  FullGameInfoResponse,
  RequestOptions,
  TwitchTokenResponse,
} from "@/shared/types";

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

let tokenCache: TwitchTokenResponse | null = null;
let tokenExpiry: number = 0;

export function resetTokenCache(): void {
  tokenCache = null;
  tokenExpiry = 0;
}

async function getToken(): Promise<string> {
  if (tokenCache && getTimeStamp() < tokenExpiry) {
    return tokenCache.access_token;
  }

  logger.debug("Requesting new Twitch access token for Steam matching");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
  });

  if (!res.ok) {
    logger.error(
      { status: res.status, statusText: res.statusText },
      "Failed to fetch Twitch token"
    );
    throw new Error(`Failed to fetch token: ${res.statusText}`);
  }

  const token = (await res.json()) as TwitchTokenResponse;
  tokenCache = token;
  tokenExpiry =
    getTimeStamp() + token.expires_in - TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS;

  logger.info(
    { expiresIn: token.expires_in },
    "Twitch access token acquired for Steam matching"
  );

  return token.access_token;
}

async function makeIgdbRequest(
  options: RequestOptions
): Promise<unknown[] | undefined> {
  try {
    logger.debug(
      { resource: options.resource },
      "Making IGDB API request for Steam matching"
    );

    const accessToken = await getToken();

    const response = await fetch(`${API_URL}${options.resource}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": env.IGDB_CLIENT_ID,
      },
      method: "POST",
      body: options.body,
    });

    if (!response.ok) {
      logger.error(
        {
          resource: options.resource,
          status: response.status,
          statusText: response.statusText,
        },
        "IGDB API request failed for Steam matching"
      );

      if (response.status === 429) {
        throw new Error("IGDB_RATE_LIMITED");
      }

      const errorBody = await response
        .text()
        .catch(() => "Unable to read body");
      throw new Error(
        `IGDB API error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    logger.debug(
      { resource: options.resource, status: response.status },
      "IGDB API request successful for Steam matching"
    );

    return (await response.json()) as unknown[];
  } catch (error) {
    logger.error(
      { error, resource: options.resource },
      "Error making IGDB API request for Steam matching"
    );
    throw error;
  }
}

/**
 * Match a Steam game to IGDB using Steam App ID lookup.
 * Uses IGDB's external_games table which has Steam Store URL mappings.
 *
 * This mirrors the Lambda implementation in lambdas-py/src/lambdas/clients/igdb.py
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

    const response = await makeIgdbRequest({ body: query, resource: "/games" });

    if (!response) {
      logger.error({ steamAppId }, "No response from IGDB for Steam matching");
      return {
        success: false,
        error: "Failed to get response from IGDB",
        code: ServiceErrorCode.EXTERNAL_SERVICE_ERROR,
      };
    }

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

    if (error instanceof Error && error.message === "IGDB_RATE_LIMITED") {
      return {
        success: false,
        error: "IGDB API rate limit exceeded. Please try again in a moment.",
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
