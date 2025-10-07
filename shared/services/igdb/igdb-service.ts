import { env } from "@/env.mjs";

import { API_URL, TOKEN_URL } from "@/shared/config/igdb";
import { getTimeStamp } from "@/shared/lib/date-functions";
import igdbApi from "@/shared/lib/igdb";
import { QueryBuilder } from "@/shared/services/igdb/query-builder";
import {
  FullGameInfoResponse,
  RequestOptions,
  TwitchTokenResponse,
} from "@/shared/types";

import { BaseService, type ServiceResponse } from "../types";
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

  constructor() {
    super();
    this.queryBuilder = new QueryBuilder();
  }

  private async requestTwitchToken() {
    try {
      const res = await globalThis.fetch(TOKEN_URL, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch token: ${res.statusText}`);
      }
      const token = (await res.json()) as unknown as TwitchTokenResponse;
      this.token = token;
      const SAFETY_MARGIN_SECONDS = 60;
      this.tokenExpiry =
        getTimeStamp() + token.expires_in - SAFETY_MARGIN_SECONDS;
      return token;
    } catch (thrown) {
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
      const accessToken = await this.getToken();

      if (accessToken === undefined) {
        this.handleError(new Error("Unauthorized: No valid token available."));
        return undefined;
      }

      const response = await globalThis.fetch(`${API_URL}${options.resource}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": env.IGDB_CLIENT_ID,
        },
        method: "POST",
        body: options.body,
      });

      if (!response.ok) {
        console.error(response);
        throw new Error(
          `IGDB API error: ${response.statusText} ${JSON.stringify(response)}`
        );
      }

      return (await response.json()) as unknown as T;
    } catch (thrown) {
      this.handleError(thrown);
      return undefined;
    }
  }

  async searchGames(
    params: GameSearchParams
  ): Promise<ServiceResponse<GameSearchResult>> {
    try {
      if (!params.name || params.name.trim() === "") {
        return this.createErrorResponse({
          message: "Game name is required for search",
          code: "INVALID_INPUT",
        });
      }

      const games = await igdbApi.search({
        name: params.name,
        fields: params.fields,
      });

      if (!games) {
        return this.createErrorResponse({
          message: "Failed to search games",
          code: "SEARCH_FAILED",
        });
      }

      return this.createSuccessResponse({
        games,
        count: games.length,
      });
    } catch (error) {
      return this.handleError(error, "Failed to search games");
    }
  }

  async getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResponse<GameDetailsResult>> {
    try {
      if (!params.gameId || params.gameId <= 0) {
        return this.createErrorResponse({
          message: "Valid game ID is required",
          code: "INVALID_INPUT",
        });
      }

      const { gameId } = params;

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

      if (resultGame) {
        return this.createSuccessResponse({
          game: resultGame[0] ?? null,
        });
      } else {
        throw new Error("Game not found");
      }
    } catch (error) {
      return this.handleError(error, "Failed to fetch game details");
    }
  }

  async getPlatforms(): Promise<ServiceResponse<PlatformsResult>> {
    try {
      const platforms = await igdbApi.getPlatforms();

      if (!platforms) {
        return this.createErrorResponse({
          message: "Failed to fetch platforms",
          code: "FETCH_FAILED",
        });
      }

      return this.createSuccessResponse({
        platforms: platforms as Array<{ id: number; name: string }>,
      });
    } catch (error) {
      return this.handleError(error, "Failed to fetch platforms");
    }
  }
}
