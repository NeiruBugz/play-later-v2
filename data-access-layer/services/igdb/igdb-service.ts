import { env } from "@/env.mjs";

import { API_URL, TOKEN_URL } from "@/shared/config/igdb";
import { getTimeStamp } from "@/shared/lib/date-functions";
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

  constructor() {
    super();
    this.queryBuilder = new QueryBuilder();
  }

  private async requestTwitchToken() {
    try {
      const res = await fetch(TOKEN_URL, {
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
        return this.error(
          "Game name is required for search",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const fields = params.fields ?? {};
      const filterConditions = this.buildSearchFilterConditions(fields);
      const filters = filterConditions ? ` & ${filterConditions}` : "";

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
        .search(normalizeGameTitle(normalizeString(params.name)))
        .limit(SEARCH_RESULTS_LIMIT)
        .build();

      const games = await this.makeRequest<SearchResponse[]>({
        body: query,
        resource: "/games",
      });

      if (!games) {
        return this.error("Failed to find games", ServiceErrorCode.NOT_FOUND);
      }

      return this.success({
        games,
        count: games.length,
      });
    } catch (error) {
      return this.handleError(error, "Failed to find games");
    }
  }

  async getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResult<GameDetailsResult>> {
    try {
      if (!params.gameId || params.gameId <= 0) {
        return this.error(
          "Valid game ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
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

      if (resultGame && resultGame[0]) {
        return this.success({
          game: resultGame[0],
        });
      } else {
        throw new Error("Game not found");
      }
    } catch (error) {
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
