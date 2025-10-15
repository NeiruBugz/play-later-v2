import { env } from "@/env.mjs";

import { API_URL, TOKEN_URL } from "@/shared/config/igdb";
import { getTimeStamp } from "@/shared/lib/date-functions";
import { createLogger } from "@/shared/lib/logger";
import { normalizeGameTitle, normalizeString } from "@/shared/lib/string";
import {
  FullGameInfoResponse,
  RequestOptions,
  TwitchTokenResponse,
  type SearchResponse,
} from "@/shared/types";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";
import { SEARCH_RESULTS_LIMIT } from "./constants";
import { QueryBuilder } from "./query-builder";
import type {
  GameDetailsParams,
  GameDetailsResult,
  GameSearchParams,
  GameSearchResult,
  IgdbService as IgdbServiceInterface,
  PlatformsResult,
} from "./types";

export class IgdbService extends BaseService implements IgdbServiceInterface {
  private token: TwitchTokenResponse | null = null;
  private tokenExpiry: number = 0;
  private queryBuilder: QueryBuilder;
  private logger = createLogger({ service: "IgdbService" });

  constructor() {
    super();
    this.queryBuilder = new QueryBuilder();
    this.logger.debug("IgdbService initialized");
  }

  private async requestTwitchToken() {
    try {
      this.logger.debug("Requesting new Twitch access token");
      const res = await fetch(TOKEN_URL, {
        method: "POST",
      });

      if (!res.ok) {
        this.logger.error(
          { status: res.status, statusText: res.statusText },
          "Failed to fetch Twitch token"
        );
        throw new Error(`Failed to fetch token: ${res.statusText}`);
      }
      const token = (await res.json()) as unknown as TwitchTokenResponse;
      this.token = token;
      const SAFETY_MARGIN_SECONDS = 60;
      this.tokenExpiry =
        getTimeStamp() + token.expires_in - SAFETY_MARGIN_SECONDS;
      this.logger.info(
        { expiresIn: token.expires_in },
        "Twitch access token acquired"
      );
      return token;
    } catch (thrown) {
      this.logger.error({ error: thrown }, "Error requesting Twitch token");
      this.handleError(thrown);
    }
  }

  private async getToken() {
    if (this.token && getTimeStamp() < this.tokenExpiry) {
      return this.token.access_token;
    }

    const token = await this.requestTwitchToken();
    if (token) {
      this.token = token;
      const SAFETY_MARGIN_SECONDS = 60;
      this.tokenExpiry =
        getTimeStamp() + token.expires_in - SAFETY_MARGIN_SECONDS;
      return token.access_token;
    }

    return null;
  }

  private async makeRequest<T>(
    options: RequestOptions
  ): Promise<T | undefined> {
    try {
      this.logger.debug(
        { resource: options.resource },
        "Making IGDB API request"
      );
      const accessToken = await this.getToken();

      if (accessToken === undefined) {
        this.logger.error("No valid access token available for IGDB request");
        this.handleError(new Error("Unauthorized: No valid token available."));
        return undefined;
      }

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
        this.logger.error(
          {
            resource: options.resource,
            status: response.status,
            statusText: response.statusText,
          },
          "IGDB API request failed"
        );
        throw new Error(
          `IGDB API error: ${response.statusText} ${JSON.stringify(response)}`
        );
      }

      this.logger.debug(
        { resource: options.resource, status: response.status },
        "IGDB API request successful"
      );
      return (await response.json()) as unknown as T;
    } catch (thrown) {
      this.logger.error(
        { error: thrown, resource: options.resource },
        "Error making IGDB API request"
      );
      this.handleError(thrown);
      return undefined;
    }
  }

  private buildSearchFilterConditions(
    fields: Record<string, string | undefined>
  ): string {
    return Object.entries(fields)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => {
        const fieldName = key === "platform" ? "platforms" : key;
        return `${fieldName} = (${value})`;
      })
      .join(" & ");
  }

  async searchGamesByName(
    params: GameSearchParams
  ): Promise<ServiceResult<GameSearchResult>> {
    try {
      if (!params.name || params.name.trim() === "") {
        this.logger.warn("Game search attempted with empty name");
        return this.error(
          "Game name is required for search",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const fields = params.fields ?? {};
      const filterConditions = this.buildSearchFilterConditions(fields);
      const filters = filterConditions ? ` & ${filterConditions}` : "";
      const normalizedSearchQuery = normalizeGameTitle(
        normalizeString(params.name)
      );

      this.logger.info(
        {
          searchQuery: params.name,
          normalizedQuery: normalizedSearchQuery,
          filters: fields,
        },
        "Searching games by name"
      );

      const query = this.queryBuilder
        .fields([
          "name",
          "platforms.name",
          "release_dates.human",
          "first_release_date",
          "category",
          "cover.image_id",
        ])
        .where(`cover.image_id != null ${filters}`)
        .search(normalizedSearchQuery)
        .limit(SEARCH_RESULTS_LIMIT)
        .build();

      const games = await this.makeRequest<SearchResponse[]>({
        body: query,
        resource: "/games",
      });

      if (!games) {
        this.logger.warn(
          { searchQuery: params.name },
          "No games found in search"
        );
        return this.error("Failed to find games", ServiceErrorCode.NOT_FOUND);
      }

      this.logger.info(
        { searchQuery: params.name, resultCount: games.length },
        "Game search completed"
      );

      return this.success({
        games,
        count: games.length,
      });
    } catch (error) {
      this.logger.error(
        { error, searchQuery: params.name },
        "Error searching games"
      );
      return this.handleError(error, "Failed to find games");
    }
  }

  async getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResult<GameDetailsResult>> {
    try {
      if (!params.gameId || params.gameId <= 0) {
        this.logger.warn(
          { gameId: params.gameId },
          "Invalid game ID provided for details fetch"
        );
        return this.error(
          "Valid game ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { gameId } = params;

      this.logger.info({ gameId }, "Fetching game details");

      const query = this.queryBuilder
        .fields([
          "name",
          "summary",
          "aggregated_rating",
          "cover.image_id",
          "genres.name",
          "screenshots.image_id",
          "release_dates.platform.name",
          "release_dates.human",
          "involved_companies.developer",
          "involved_companies.publisher",
          "involved_companies.company.name",
          "game_modes.name",
          "game_engines.name",
          "player_perspectives.name",
          "themes.name",
          "external_games.category",
          "external_games.name",
          "external_games.url",
          "similar_games.name",
          "similar_games.cover.image_id",
          "similar_games.release_dates.human",
          "similar_games.first_release_date",
          "websites.url",
          "websites.category",
          "websites.trusted",
          "franchise",
          "franchises",
          "game_type",
          "game_type.type",
        ])
        .where(`id = (${gameId})`)
        .limit(1)
        .build();

      const resultGame = await this.makeRequest<FullGameInfoResponse[]>({
        body: query,
        resource: "/games",
      });

      if (resultGame && resultGame[0]) {
        this.logger.info(
          { gameId, gameName: resultGame[0].name },
          "Game details fetched successfully"
        );
        return this.success({
          game: resultGame[0],
        });
      } else {
        this.logger.warn({ gameId }, "Game not found");
        throw new Error("Game not found");
      }
    } catch (error) {
      this.logger.error(
        { error, gameId: params.gameId },
        "Error fetching game details"
      );
      return this.handleError(error, "Failed to fetch game details");
    }
  }

  async getPlatforms(): Promise<ServiceResult<PlatformsResult>> {
    try {
      const query = this.queryBuilder.fields(["name"]).build();

      const platforms = await this.makeRequest<
        Array<{ id: number; name: string }>
      >({
        body: query,
        resource: "/platforms",
      });

      if (!platforms) {
        return this.error(
          "Failed to fetch platforms",
          ServiceErrorCode.NOT_FOUND
        );
      }

      return this.success({
        platforms,
      });
    } catch (error) {
      return this.handleError(error, "Failed to fetch platforms");
    }
  }
}
