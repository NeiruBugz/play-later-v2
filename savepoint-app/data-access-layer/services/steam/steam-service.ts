import { env } from "@/env.mjs";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";
import type {
  GetPlayerSummaryInput,
  ResolveVanityUrlInput,
  SteamPlayerSummariesResponse,
  SteamProfile,
  SteamResolveVanityResponse,
  ValidateSteamIdInput,
} from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "SteamService" });

const STEAM_ID_64_REGEX = /^\d{17}$/;

export class SteamService extends BaseService {
  private apiKey = env.STEAM_API_KEY;
  private baseUrl = "https://api.steampowered.com";

  async resolveVanityURL(
    params: ResolveVanityUrlInput
  ): Promise<ServiceResult<string>> {
    const { vanityUrl } = params;

    logger.info({ vanityUrl }, "Resolving Steam vanity URL");

    try {
      const url = `${this.baseUrl}/ISteamUser/ResolveVanityURL/v1/?key=${this.apiKey}&vanityurl=${vanityUrl}`;
      const response = await fetch(url);

      if (!response.ok) {
        logger.error(
          { status: response.status, statusText: response.statusText },
          "Steam API request failed"
        );
        return this.error(
          "Failed to resolve Steam vanity URL",
          ServiceErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }

      const data = (await response.json()) as SteamResolveVanityResponse;

      if (data.response.success === 1 && data.response.steamid) {
        logger.info(
          { vanityUrl, steamId64: data.response.steamid },
          "Successfully resolved vanity URL"
        );
        return this.success(data.response.steamid);
      }

      logger.warn(
        { vanityUrl, message: data.response.message },
        "Vanity URL not found"
      );
      return this.error("Steam profile not found", ServiceErrorCode.NOT_FOUND);
    } catch (error) {
      logger.error({ error, vanityUrl }, "Error resolving vanity URL");
      return this.handleError(error, "Failed to resolve Steam vanity URL");
    }
  }

  async getPlayerSummary(
    params: GetPlayerSummaryInput
  ): Promise<ServiceResult<SteamProfile>> {
    const { steamId64 } = params;

    logger.info({ steamId64 }, "Fetching Steam player summary");

    try {
      const url = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v2/?key=${this.apiKey}&steamids=${steamId64}`;
      const response = await fetch(url);

      if (!response.ok) {
        logger.error(
          { status: response.status, statusText: response.statusText },
          "Steam API request failed"
        );
        return this.error(
          "Failed to fetch player summary",
          ServiceErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }

      const data = (await response.json()) as SteamPlayerSummariesResponse;

      if (!data.response.players || data.response.players.length === 0) {
        logger.warn({ steamId64 }, "Steam profile not found");
        return this.error(
          "Steam profile not found",
          ServiceErrorCode.NOT_FOUND
        );
      }

      const player = data.response.players[0];

      const isPublic = player.communityvisibilitystate === 3;

      if (!isPublic) {
        logger.warn({ steamId64 }, "Steam profile is private");
        return this.error(
          "Steam profile is private. Please set your profile to public to import your library.",
          ServiceErrorCode.UNAUTHORIZED
        );
      }

      const profile: SteamProfile = {
        steamId64: player.steamid,
        displayName: player.personaname,
        avatarUrl: player.avatarfull,
        profileUrl: player.profileurl,
        isPublic,
      };

      logger.info(
        { steamId64, displayName: profile.displayName },
        "Player summary fetched successfully"
      );

      return this.success(profile);
    } catch (error) {
      logger.error({ error, steamId64 }, "Error fetching player summary");
      return this.handleError(error, "Failed to fetch Steam player summary");
    }
  }

  async validateSteamId(
    params: ValidateSteamIdInput
  ): Promise<ServiceResult<string>> {
    const { input } = params;

    logger.info({ input }, "Validating Steam ID input");

    const trimmedInput = input.trim();

    if (STEAM_ID_64_REGEX.test(trimmedInput)) {
      logger.info(
        { steamId64: trimmedInput },
        "Input is already a valid Steam ID64"
      );
      return this.success(trimmedInput);
    }

    logger.info(
      { input: trimmedInput },
      "Input appears to be a vanity URL, attempting to resolve"
    );

    const resolveResult = await this.resolveVanityURL({
      vanityUrl: trimmedInput,
    });

    if (!resolveResult.success) {
      logger.warn({ input: trimmedInput }, "Failed to validate Steam ID");
      return this.error(
        "Invalid Steam ID. Please provide a 17-digit Steam ID64 or a valid Steam vanity URL.",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    return this.success(resolveResult.data);
  }
}
