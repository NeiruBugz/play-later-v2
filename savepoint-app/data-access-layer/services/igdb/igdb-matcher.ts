import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { ExternalServiceError } from "@/shared/lib/errors";
import {
  __resetTokenCacheForTests,
  igdbFetch,
  IgdbRateLimitError as IgdbTransportRateLimitError,
} from "@/shared/lib/igdb";
import type { FullGameInfoResponse } from "@/shared/types";

import { IgdbRateLimitError } from "./errors";
import { FullGameInfoResponseSchema } from "./schemas";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "IgdbMatcher" });

const STEAM_STORE_URL = "https://store.steampowered.com/app";

export const MatchSteamGameSchema = z.object({
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

export async function matchSteamGameToIgdb(
  params: MatchSteamGameParams
): Promise<MatchSteamGameResult> {
  const { steamAppId } = params;

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

  let response: unknown[];
  try {
    response = await igdbFetch<unknown[]>("/games", query);
  } catch (error) {
    logger.error({ error, steamAppId }, "Error matching Steam game to IGDB");

    if (error instanceof IgdbTransportRateLimitError) {
      throw new IgdbRateLimitError(
        "IGDB rate limit exceeded. Please try again later.",
        {
          retryAfter: error.retryAfterMs
            ? error.retryAfterMs / 1000
            : undefined,
        }
      );
    }

    throw new ExternalServiceError(
      error instanceof Error
        ? error.message
        : "Failed to match Steam game to IGDB",
      { cause: error }
    );
  }

  const result = z.array(FullGameInfoResponseSchema).safeParse(response);

  if (!result.success) {
    logger.error(
      { errors: result.error.issues, steamAppId },
      "IGDB response validation failed for Steam matching"
    );
    throw new ExternalServiceError("Invalid response from IGDB", {
      steamAppId,
    });
  }

  if (result.data.length === 0) {
    logger.info(
      { steamAppId, steamUrl },
      "No IGDB match found for Steam App ID"
    );
    return { game: null };
  }

  const game = result.data[0];
  logger.info(
    { steamAppId, igdbId: game.id, gameName: game.name },
    "Successfully matched Steam game to IGDB"
  );

  return { game };
}
