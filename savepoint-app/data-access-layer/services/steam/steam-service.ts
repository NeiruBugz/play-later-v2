import {
  disconnectSteam as disconnectSteamRepo,
  updateUserSteamData,
} from "@/data-access-layer/repository/user/user-repository";
import { env } from "@/env.mjs";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { NotFoundError } from "@/shared/lib/errors";

import { SteamApiUnavailableError, SteamProfilePrivateError } from "./errors";
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
      throw new SteamApiUnavailableError(
        `Steam request timed out after ${timeout}ms`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function throwForNetworkError(
  error: unknown,
  context: Record<string, unknown>
): never {
  if (error instanceof SteamApiUnavailableError) {
    throw error;
  }

  if (
    error instanceof TypeError &&
    (error.message.includes("fetch") || error.message.includes("network"))
  ) {
    throw new SteamApiUnavailableError(
      "Steam is temporarily unavailable. Please try again later.",
      context
    );
  }

  throw error;
}

export class SteamService {
  private apiKey = env.STEAM_API_KEY;
  private baseUrl = "https://api.steampowered.com";

  async resolveVanityURL(params: ResolveVanityUrlInput): Promise<string> {
    const { vanityUrl } = params;

    let response: Response;
    try {
      const url = new URL(`${this.baseUrl}/ISteamUser/ResolveVanityURL/v1/`);
      url.searchParams.set("key", this.apiKey);
      url.searchParams.set("vanityurl", vanityUrl);
      response = await fetchWithTimeout(url.toString());
    } catch (error) {
      logger.error({ error, vanityUrl }, "Error resolving vanity URL");
      throwForNetworkError(error, { vanityUrl });
    }

    if (!response.ok) {
      logger.error(
        { status: response.status, statusText: response.statusText },
        "Steam API request failed"
      );

      if (response.status === 429) {
        throw new SteamApiUnavailableError(
          "Too many requests to Steam. Please wait a moment and try again.",
          { vanityUrl, status: response.status }
        );
      }

      if (response.status >= 500) {
        throw new SteamApiUnavailableError(
          "Steam is temporarily unavailable. Please try again later.",
          { vanityUrl, status: response.status }
        );
      }

      throw new SteamApiUnavailableError("Failed to resolve Steam vanity URL", {
        vanityUrl,
        status: response.status,
      });
    }

    const data = (await response.json()) as SteamResolveVanityResponse;

    if (data.response.success === 1 && data.response.steamid) {
      return data.response.steamid;
    }

    logger.warn(
      { vanityUrl, message: data.response.message },
      "Vanity URL not found"
    );
    throw new NotFoundError("Steam profile not found", { vanityUrl });
  }

  async getPlayerSummary(params: GetPlayerSummaryInput): Promise<SteamProfile> {
    const { steamId64 } = params;

    let response: Response;
    try {
      const url = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v2/?key=${this.apiKey}&steamids=${steamId64}`;
      response = await fetchWithTimeout(url);
    } catch (error) {
      logger.error({ error, steamId64 }, "Error fetching player summary");
      throwForNetworkError(error, { steamId64 });
    }

    if (!response.ok) {
      logger.error(
        { status: response.status, statusText: response.statusText },
        "Steam API request failed"
      );

      if (response.status === 429) {
        throw new SteamApiUnavailableError(
          "Too many requests to Steam. Please wait a moment and try again.",
          { steamId64, status: response.status }
        );
      }

      if (response.status >= 500) {
        throw new SteamApiUnavailableError(
          "Steam is temporarily unavailable. Please try again later.",
          { steamId64, status: response.status }
        );
      }

      throw new SteamApiUnavailableError("Failed to fetch player summary", {
        steamId64,
        status: response.status,
      });
    }

    const data = (await response.json()) as SteamPlayerSummariesResponse;

    if (!data.response.players || data.response.players.length === 0) {
      logger.warn({ steamId64 }, "Steam profile not found");
      throw new NotFoundError("Steam profile not found", { steamId64 });
    }

    const player = data.response.players[0];
    const isPublic = player.communityvisibilitystate === 3;

    if (!isPublic) {
      logger.warn({ steamId64 }, "Steam profile is private");
      throw new SteamProfilePrivateError(
        "Your Steam profile game details are set to private. To import your library, please set your game details to public in Steam Privacy Settings.",
        { steamId64 }
      );
    }

    return {
      steamId64: player.steamid,
      displayName: player.personaname,
      avatarUrl: player.avatarfull,
      profileUrl: player.profileurl,
      isPublic,
    };
  }

  async validateSteamId(params: ValidateSteamIdInput): Promise<string> {
    const { input } = params;
    const trimmedInput = input.trim();

    if (STEAM_ID_64_REGEX.test(trimmedInput)) {
      return trimmedInput;
    }

    return this.resolveVanityURL({ vanityUrl: trimmedInput });
  }

  async getOwnedGames(params: GetOwnedGamesInput): Promise<SteamOwnedGame[]> {
    const { steamId64 } = params;

    let response: Response;
    try {
      const url = new URL(`${this.baseUrl}/IPlayerService/GetOwnedGames/v1/`);
      url.searchParams.set("key", this.apiKey);
      url.searchParams.set("steamid", steamId64);
      url.searchParams.set("include_appinfo", "1");
      url.searchParams.set("include_played_free_games", "1");
      url.searchParams.set("include_extended_appinfo", "1");
      response = await fetchWithTimeout(url.toString());
    } catch (error) {
      logger.error({ error, steamId64 }, "Error fetching owned games");
      throwForNetworkError(error, { steamId64 });
    }

    if (!response.ok) {
      logger.error(
        { status: response.status, statusText: response.statusText },
        "Steam API request failed"
      );

      if (response.status === 429) {
        throw new SteamApiUnavailableError(
          "Too many requests to Steam. Please wait a moment and try again.",
          { steamId64, status: response.status }
        );
      }

      if (response.status >= 500) {
        throw new SteamApiUnavailableError(
          "Steam is temporarily unavailable. Please try again later.",
          { steamId64, status: response.status }
        );
      }

      throw new SteamApiUnavailableError(
        "Failed to fetch owned games from Steam",
        { steamId64, status: response.status }
      );
    }

    const data = (await response.json()) as SteamOwnedGamesResponse;

    if (!data.response.games) {
      if (data.response.game_count > 0) {
        throw new SteamProfilePrivateError(
          "Your Steam profile game details are set to private. To import your library, please set your game details to public in Steam Privacy Settings.",
          { steamId64 }
        );
      }

      return [];
    }

    return data.response.games.map((game) => ({
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
  }

  async disconnectSteam(params: { userId: string }): Promise<void> {
    const { userId } = params;
    await disconnectSteamRepo({ userId });
  }

  async connectSteamAccount(params: {
    userId: string;
    profile: SteamProfile;
  }): Promise<void> {
    const { userId, profile } = params;
    await updateUserSteamData({
      userId,
      steamId: profile.steamId64,
      username: profile.displayName,
      avatar: profile.avatarUrl,
      profileUrl: profile.profileUrl,
      connectedAt: new Date(),
    });
  }
}
