import {
  disconnectSteam as disconnectSteamRepo,
  updateUserSteamData,
} from "@/data-access-layer/repository/user/user-repository";
import { env } from "@/env.mjs";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import {
  handleServiceError,
  serviceError,
  ServiceErrorCode,
  serviceSuccess,
  type ServiceResult,
} from "../types";
import type {
  GetOwnedGamesInput,
  GetPlayerSummaryInput,
  ResolveVanityUrlInput,
  SteamOwnedGame,
  SteamOwnedGamesResponse,
  SteamPlayerSummariesResponse,
  SteamProfile,
  SteamResolveVanityResponse,
  ValidateSteamIdInput,
} from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "SteamService" });

const STEAM_ID_64_REGEX = /^\d{17}$/;
const DEFAULT_TIMEOUT_MS = 30000;

async function fetchWithTimeout(
  url: string | URL,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export class SteamService {
  private apiKey = env.STEAM_API_KEY;
  private baseUrl = "https://api.steampowered.com";

  async resolveVanityURL(
    params: ResolveVanityUrlInput
  ): Promise<ServiceResult<string>> {
    const { vanityUrl } = params;

    try {
      const url = new URL(`${this.baseUrl}/ISteamUser/ResolveVanityURL/v1/`);
      url.searchParams.set("key", this.apiKey);
      url.searchParams.set("vanityurl", vanityUrl);
      const response = await fetchWithTimeout(url.toString());

      if (!response.ok) {
        logger.error(
          { status: response.status, statusText: response.statusText },
          "Steam API request failed"
        );

        if (response.status === 429) {
          return serviceError(
            "Too many requests to Steam. Please wait a moment and try again.",
            ServiceErrorCode.RATE_LIMITED
          );
        }

        if (response.status >= 500) {
          return serviceError(
            "Steam is temporarily unavailable. Please try again later.",
            ServiceErrorCode.STEAM_API_UNAVAILABLE
          );
        }

        return serviceError(
          "Failed to resolve Steam vanity URL",
          ServiceErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }

      const data = (await response.json()) as SteamResolveVanityResponse;

      if (data.response.success === 1 && data.response.steamid) {
        return serviceSuccess(data.response.steamid);
      }

      logger.warn(
        { vanityUrl, message: data.response.message },
        "Vanity URL not found"
      );
      return serviceError(
        "Steam profile not found",
        ServiceErrorCode.NOT_FOUND
      );
    } catch (error) {
      logger.error({ error, vanityUrl }, "Error resolving vanity URL");

      if (error instanceof Error && error.message.includes("timed out")) {
        return serviceError(
          "Steam is taking too long to respond. Please try again later.",
          ServiceErrorCode.STEAM_API_UNAVAILABLE
        );
      }

      if (
        error instanceof TypeError &&
        (error.message.includes("fetch") || error.message.includes("network"))
      ) {
        return serviceError(
          "Steam is temporarily unavailable. Please try again later.",
          ServiceErrorCode.STEAM_API_UNAVAILABLE
        );
      }

      return handleServiceError(error, "Failed to resolve Steam vanity URL");
    }
  }

  async getPlayerSummary(
    params: GetPlayerSummaryInput
  ): Promise<ServiceResult<SteamProfile>> {
    const { steamId64 } = params;

    try {
      const url = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v2/?key=${this.apiKey}&steamids=${steamId64}`;
      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        logger.error(
          { status: response.status, statusText: response.statusText },
          "Steam API request failed"
        );

        if (response.status === 429) {
          return serviceError(
            "Too many requests to Steam. Please wait a moment and try again.",
            ServiceErrorCode.RATE_LIMITED
          );
        }

        if (response.status >= 500) {
          return serviceError(
            "Steam is temporarily unavailable. Please try again later.",
            ServiceErrorCode.STEAM_API_UNAVAILABLE
          );
        }

        return serviceError(
          "Failed to fetch player summary",
          ServiceErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }

      const data = (await response.json()) as SteamPlayerSummariesResponse;

      if (!data.response.players || data.response.players.length === 0) {
        logger.warn({ steamId64 }, "Steam profile not found");
        return serviceError(
          "Steam profile not found",
          ServiceErrorCode.NOT_FOUND
        );
      }

      const player = data.response.players[0];

      const isPublic = player.communityvisibilitystate === 3;

      if (!isPublic) {
        logger.warn({ steamId64 }, "Steam profile is private");
        return serviceError(
          "Your Steam profile game details are set to private. To import your library, please set your game details to public in Steam Privacy Settings.",
          ServiceErrorCode.STEAM_PROFILE_PRIVATE
        );
      }

      const profile: SteamProfile = {
        steamId64: player.steamid,
        displayName: player.personaname,
        avatarUrl: player.avatarfull,
        profileUrl: player.profileurl,
        isPublic,
      };

      return serviceSuccess(profile);
    } catch (error) {
      logger.error({ error, steamId64 }, "Error fetching player summary");

      if (error instanceof Error && error.message.includes("timed out")) {
        return serviceError(
          "Steam is taking too long to respond. Please try again later.",
          ServiceErrorCode.STEAM_API_UNAVAILABLE
        );
      }

      if (
        error instanceof TypeError &&
        (error.message.includes("fetch") || error.message.includes("network"))
      ) {
        return serviceError(
          "Steam is temporarily unavailable. Please try again later.",
          ServiceErrorCode.STEAM_API_UNAVAILABLE
        );
      }

      return handleServiceError(error, "Failed to fetch Steam player summary");
    }
  }

  async validateSteamId(
    params: ValidateSteamIdInput
  ): Promise<ServiceResult<string>> {
    const { input } = params;

    const trimmedInput = input.trim();

    if (STEAM_ID_64_REGEX.test(trimmedInput)) {
      return serviceSuccess(trimmedInput);
    }

    const resolveResult = await this.resolveVanityURL({
      vanityUrl: trimmedInput,
    });

    if (!resolveResult.success) {
      logger.warn({ input: trimmedInput }, "Failed to validate Steam ID");
      return serviceError(
        "Invalid Steam ID. Please provide a 17-digit Steam ID64 or a valid Steam vanity URL.",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    return serviceSuccess(resolveResult.data);
  }

  async getOwnedGames(
    params: GetOwnedGamesInput
  ): Promise<ServiceResult<SteamOwnedGame[]>> {
    const { steamId64 } = params;

    try {
      const url = new URL(`${this.baseUrl}/IPlayerService/GetOwnedGames/v1/`);
      url.searchParams.set("key", this.apiKey);
      url.searchParams.set("steamid", steamId64);
      url.searchParams.set("include_appinfo", "1");
      url.searchParams.set("include_played_free_games", "1");
      url.searchParams.set("include_extended_appinfo", "1");

      const response = await fetchWithTimeout(url.toString());

      if (!response.ok) {
        logger.error(
          { status: response.status, statusText: response.statusText },
          "Steam API request failed"
        );

        if (response.status === 429) {
          return serviceError(
            "Too many requests to Steam. Please wait a moment and try again.",
            ServiceErrorCode.RATE_LIMITED
          );
        }

        if (response.status >= 500) {
          return serviceError(
            "Steam is temporarily unavailable. Please try again later.",
            ServiceErrorCode.STEAM_API_UNAVAILABLE
          );
        }

        return serviceError(
          "Failed to fetch owned games from Steam",
          ServiceErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }

      const data = (await response.json()) as SteamOwnedGamesResponse;

      if (!data.response.games) {
        if (data.response.game_count > 0) {
          return serviceError(
            "Your Steam profile game details are set to private. To import your library, please set your game details to public in Steam Privacy Settings.",
            ServiceErrorCode.STEAM_PROFILE_PRIVATE
          );
        }

        return serviceSuccess([]);
      }

      const ownedGames: SteamOwnedGame[] = data.response.games.map((game) => ({
        appId: game.appid,
        name: game.name,
        playtimeForever: game.playtime_forever,
        playtimeWindows: game.playtime_windows_forever ?? 0,
        playtimeMac: game.playtime_mac_forever ?? 0,
        playtimeLinux: game.playtime_linux_forever ?? 0,
        imgIconUrl: game.img_icon_url ?? null,
        imgLogoUrl: game.img_logo_url ?? null,
        rtimeLastPlayed: game.rtime_last_played ?? null,
      }));

      return serviceSuccess(ownedGames);
    } catch (error) {
      logger.error({ error, steamId64 }, "Error fetching owned games");

      if (error instanceof Error && error.message.includes("timed out")) {
        return serviceError(
          "Steam is taking too long to respond. Please try again later.",
          ServiceErrorCode.STEAM_API_UNAVAILABLE
        );
      }

      if (
        error instanceof TypeError &&
        (error.message.includes("fetch") || error.message.includes("network"))
      ) {
        return serviceError(
          "Steam is temporarily unavailable. Please try again later.",
          ServiceErrorCode.STEAM_API_UNAVAILABLE
        );
      }

      return handleServiceError(
        error,
        "Failed to fetch owned games from Steam"
      );
    }
  }

  async disconnectSteam(params: {
    userId: string;
  }): Promise<ServiceResult<void>> {
    const { userId } = params;

    try {
      await disconnectSteamRepo({ userId });

      return serviceSuccess(undefined);
    } catch (error) {
      logger.error({ error, userId }, "Error disconnecting Steam account");
      return handleServiceError(error, "Failed to disconnect Steam account");
    }
  }

  async connectSteamAccount(params: {
    userId: string;
    profile: SteamProfile;
  }): Promise<ServiceResult<void>> {
    const { userId, profile } = params;

    try {
      await updateUserSteamData({
        userId,
        steamId: profile.steamId64,
        username: profile.displayName,
        avatar: profile.avatarUrl,
        profileUrl: profile.profileUrl,
        connectedAt: new Date(),
      });

      return serviceSuccess(undefined);
    } catch (error) {
      logger.error({ error, userId }, "Error connecting Steam account");
      return handleServiceError(error, "Failed to connect Steam account");
    }
  }
}
