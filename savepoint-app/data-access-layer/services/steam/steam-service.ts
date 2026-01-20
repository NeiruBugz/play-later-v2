import {
  disconnectSteam as disconnectSteamRepo,
  updateUserSteamData,
} from "@/data-access-layer/repository/user/user-repository";
import { env } from "@/env.mjs";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";
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

export class SteamService extends BaseService {
  private apiKey = env.STEAM_API_KEY;
  private baseUrl = "https://api.steampowered.com";

  async resolveVanityURL(
    params: ResolveVanityUrlInput
  ): Promise<ServiceResult<string>> {
    const { vanityUrl } = params;

    logger.info({ vanityUrl }, "Resolving Steam vanity URL");

    try {
      const url = new URL(`${this.baseUrl}/ISteamUser/ResolveVanityURL/v1/`);
      url.searchParams.set("key", this.apiKey);
      url.searchParams.set("vanityurl", vanityUrl);
      const response = await fetch(url.toString());

      if (!response.ok) {
        logger.error(
          { status: response.status, statusText: response.statusText },
          "Steam API request failed"
        );

        if (response.status === 429) {
          return this.error(
            "Too many requests to Steam. Please wait a moment and try again.",
            ServiceErrorCode.RATE_LIMITED
          );
        }

        if (response.status >= 500) {
          return this.error(
            "Steam is temporarily unavailable. Please try again later.",
            ServiceErrorCode.STEAM_API_UNAVAILABLE
          );
        }

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

      if (
        error instanceof TypeError &&
        (error.message.includes("fetch") || error.message.includes("network"))
      ) {
        return this.error(
          "Steam is temporarily unavailable. Please try again later.",
          ServiceErrorCode.STEAM_API_UNAVAILABLE
        );
      }

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

        if (response.status === 429) {
          return this.error(
            "Too many requests to Steam. Please wait a moment and try again.",
            ServiceErrorCode.RATE_LIMITED
          );
        }

        if (response.status >= 500) {
          return this.error(
            "Steam is temporarily unavailable. Please try again later.",
            ServiceErrorCode.STEAM_API_UNAVAILABLE
          );
        }

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

      logger.info(
        { steamId64, displayName: profile.displayName },
        "Player summary fetched successfully"
      );

      return this.success(profile);
    } catch (error) {
      logger.error({ error, steamId64 }, "Error fetching player summary");

      if (
        error instanceof TypeError &&
        (error.message.includes("fetch") || error.message.includes("network"))
      ) {
        return this.error(
          "Steam is temporarily unavailable. Please try again later.",
          ServiceErrorCode.STEAM_API_UNAVAILABLE
        );
      }

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

  async getOwnedGames(
    params: GetOwnedGamesInput
  ): Promise<ServiceResult<SteamOwnedGame[]>> {
    const { steamId64 } = params;

    logger.info({ steamId64 }, "Fetching owned games from Steam");

    try {
      const url = new URL(`${this.baseUrl}/IPlayerService/GetOwnedGames/v1/`);
      url.searchParams.set("key", this.apiKey);
      url.searchParams.set("steamid", steamId64);
      url.searchParams.set("include_appinfo", "1");
      url.searchParams.set("include_played_free_games", "1");
      url.searchParams.set("include_extended_appinfo", "1");

      const response = await fetch(url.toString());

      if (!response.ok) {
        logger.error(
          { status: response.status, statusText: response.statusText },
          "Steam API request failed"
        );

        if (response.status === 429) {
          return this.error(
            "Too many requests to Steam. Please wait a moment and try again.",
            ServiceErrorCode.RATE_LIMITED
          );
        }

        if (response.status >= 500) {
          return this.error(
            "Steam is temporarily unavailable. Please try again later.",
            ServiceErrorCode.STEAM_API_UNAVAILABLE
          );
        }

        return this.error(
          "Failed to fetch owned games from Steam",
          ServiceErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }

      const data = (await response.json()) as SteamOwnedGamesResponse;

      if (!data.response.games) {
        logger.info(
          { steamId64, gameCount: data.response.game_count },
          "No games found or library is private"
        );

        if (data.response.game_count > 0) {
          return this.error(
            "Your Steam profile game details are set to private. To import your library, please set your game details to public in Steam Privacy Settings.",
            ServiceErrorCode.STEAM_PROFILE_PRIVATE
          );
        }

        return this.success([]);
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

      logger.info(
        { steamId64, gameCount: ownedGames.length },
        "Successfully fetched owned games"
      );

      return this.success(ownedGames);
    } catch (error) {
      logger.error({ error, steamId64 }, "Error fetching owned games");

      if (
        error instanceof TypeError &&
        (error.message.includes("fetch") || error.message.includes("network"))
      ) {
        return this.error(
          "Steam is temporarily unavailable. Please try again later.",
          ServiceErrorCode.STEAM_API_UNAVAILABLE
        );
      }

      return this.handleError(error, "Failed to fetch owned games from Steam");
    }
  }

  async disconnectSteam(params: {
    userId: string;
  }): Promise<ServiceResult<void>> {
    const { userId } = params;

    logger.info({ userId }, "Disconnecting Steam account");

    try {
      const result = await disconnectSteamRepo({ userId });

      if (!result.success) {
        logger.error(
          { userId, error: result.error },
          "Failed to disconnect Steam account"
        );
        return this.error(
          result.error.message,
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      logger.info({ userId }, "Steam account disconnected successfully");
      return this.success(undefined);
    } catch (error) {
      logger.error({ error, userId }, "Error disconnecting Steam account");
      return this.handleError(error, "Failed to disconnect Steam account");
    }
  }

  async connectSteamAccount(params: {
    userId: string;
    profile: SteamProfile;
  }): Promise<ServiceResult<void>> {
    const { userId, profile } = params;

    logger.info(
      { userId, steamId64: profile.steamId64, displayName: profile.displayName },
      "Connecting Steam account"
    );

    try {
      const result = await updateUserSteamData({
        userId,
        steamId: profile.steamId64,
        username: profile.displayName,
        avatar: profile.avatarUrl,
        profileUrl: profile.profileUrl,
        connectedAt: new Date(),
      });

      if (!result.success) {
        logger.error(
          { userId, error: result.error },
          "Failed to connect Steam account"
        );
        return this.error(
          result.error.message,
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      logger.info(
        { userId, steamId64: profile.steamId64 },
        "Steam account connected successfully"
      );
      return this.success(undefined);
    } catch (error) {
      logger.error({ error, userId }, "Error connecting Steam account");
      return this.handleError(error, "Failed to connect Steam account");
    }
  }
}
