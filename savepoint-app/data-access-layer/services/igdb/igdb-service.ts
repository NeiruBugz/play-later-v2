import { env } from "@/env.mjs";

import { API_URL, TOKEN_URL } from "@/shared/config/igdb";
import {
  createLogger,
  getTimeStamp,
  normalizeGameTitle,
  normalizeString,
} from "@/shared/lib";
import {
  FullGameInfoResponse,
  RequestOptions,
  TwitchTokenResponse,
  type SearchResponse,
} from "@/shared/types";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";
import { SEARCH_RESULTS_LIMIT, TOP_RATED_GAMES_LIMIT } from "./constants";
import { QueryBuilder } from "./query-builder";
import type {
  GameAggregatedRatingResult,
  GameBySteamAppIdResult,
  GameCompletionTimesResult,
  GameDetailsParams,
  GameDetailsResult,
  GameExpansionsResult,
  GameGenresResult,
  GameScreenshotsResult,
  GameSearchParams,
  GameSearchResult,
  GetGameAggregatedRatingParams,
  GetGameBySteamAppIdParams,
  GetGameCompletionTimesParams,
  GetGameExpansionsParams,
  GetGameGenresParams,
  GetGameScreenshotsParams,
  GetSimilarGamesParams,
  IgdbService as IgdbServiceInterface,
  PlatformSearchResult,
  PlatformsResult,
  SearchPlatformByNameParams,
  SimilarGamesResult,
  TopRatedGamesResult,
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

  async getGameBySteamAppId(
    params: GetGameBySteamAppIdParams
  ): Promise<ServiceResult<GameBySteamAppIdResult>> {
    try {
      // 1. Input validation
      if (!params.steamAppId || params.steamAppId <= 0) {
        this.logger.warn(
          { steamAppId: params.steamAppId },
          "Invalid Steam app ID provided"
        );
        return this.error(
          "Valid Steam app ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { steamAppId } = params;

      this.logger.info({ steamAppId }, "Looking up game by Steam app ID");

      // 2. Build query
      const steamUrl = `https://store.steampowered.com/app/${steamAppId}`;
      const query = new QueryBuilder()
        .fields(["name"])
        .where(
          `external_games.category = 1 & external_games.url = "${steamUrl}"`
        )
        .limit(1)
        .build();

      // 3. Make API request
      const response = await this.makeRequest<
        Array<{ id: number; name: string }>
      >({
        body: query,
        resource: "/games",
      });

      // 4. Handle empty response (NOT_FOUND)
      if (!response || response.length === 0) {
        this.logger.warn({ steamAppId }, "No IGDB game found for Steam app ID");
        return this.error(
          `No IGDB game found for Steam app ID ${steamAppId}`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      // 5. Return success
      this.logger.info(
        { steamAppId, gameId: response[0].id, gameName: response[0].name },
        "Game found by Steam app ID"
      );

      return this.success({
        game: response[0],
      });
    } catch (error) {
      // 6. Catch-all error handling
      this.logger.error(
        { error, steamAppId: params.steamAppId },
        "Error fetching game by Steam app ID"
      );
      return this.handleError(error, "Failed to fetch game by Steam app ID");
    }
  }

  /**
   * Get top-rated games from IGDB
   * Returns games sorted by aggregated rating in descending order
   *
   * @returns ServiceResult with array of top-rated games
   */
  async getTopRatedGames(): Promise<ServiceResult<TopRatedGamesResult>> {
    try {
      this.logger.info("Fetching top-rated games");

      // Build query (migrated from legacy getGamesByRating implementation)
      const query = new QueryBuilder()
        .fields(["name", "cover.image_id", "aggregated_rating"])
        .where(
          "aggregated_rating_count > 20 & aggregated_rating != null & rating != null & category = 0"
        )
        .sort("aggregated_rating", "desc")
        .limit(TOP_RATED_GAMES_LIMIT)
        .build();

      // Make API request
      const response = await this.makeRequest<
        Array<{
          id: number;
          name: string;
          aggregated_rating?: number;
          cover?: {
            image_id: string;
          };
        }>
      >({
        body: query,
        resource: "/games",
      });

      // Handle error response (undefined means API error occurred)
      if (response === undefined) {
        this.logger.error("Failed to fetch top-rated games from IGDB API");
        return this.error(
          "Failed to fetch top-rated games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      // Handle empty response (not an error, just no results)
      if (response.length === 0) {
        this.logger.info("No top-rated games found (empty response)");
        return this.success({
          games: [],
        });
      }

      this.logger.info(
        { count: response.length },
        "Top-rated games fetched successfully"
      );

      // Return success
      return this.success({
        games: response,
      });
    } catch (error) {
      this.logger.error({ error }, "Error fetching top-rated games");
      return this.handleError(error, "Failed to fetch top-rated games");
    }
  }

  /**
   * Search for platforms by name
   * Returns platforms matching the search query
   *
   * @param params - Search parameters containing platform name
   * @returns ServiceResult with array of matching platforms
   */
  async searchPlatformByName(
    params: SearchPlatformByNameParams
  ): Promise<ServiceResult<PlatformSearchResult>> {
    try {
      // 1. Input validation
      if (!params.platformName || params.platformName.trim() === "") {
        this.logger.warn(
          { platformName: params.platformName },
          "Invalid platform name provided"
        );
        return this.error(
          "Platform name is required for search",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { platformName } = params;

      this.logger.info({ platformName }, "Searching platforms by name");

      // 2. Build query
      const query = new QueryBuilder()
        .fields(["id", "name", "abbreviation"])
        .search(platformName)
        .limit(10)
        .build();

      // 3. Make API request
      const response = await this.makeRequest<
        Array<{
          id: number;
          name: string;
          abbreviation?: string;
        }>
      >({
        body: query,
        resource: "/platforms",
      });

      // 4. Handle error response (undefined means API error occurred)
      if (response === undefined) {
        this.logger.error("Failed to search platforms from IGDB API");
        return this.error(
          "Failed to search platforms",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      // 5. Handle empty response (not an error, just no results)
      if (response.length === 0) {
        this.logger.warn(
          { platformName },
          "No platforms found matching search"
        );
        return this.error(
          `No platforms found matching "${platformName}"`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      // 6. Return success
      this.logger.info(
        { platformName, count: response.length },
        "Platforms found successfully"
      );

      return this.success({
        platforms: response,
      });
    } catch (error) {
      // 7. Catch-all error handling
      this.logger.error(
        { error, platformName: params.platformName },
        "Error searching platforms"
      );
      return this.handleError(error, "Failed to search platforms");
    }
  }

  /**
   * Get screenshots for a specific game
   * Returns array of screenshot objects with image IDs and URLs
   *
   * @param params - Parameters containing game ID
   * @returns ServiceResult with array of screenshots
   */
  async getGameScreenshots(
    params: GetGameScreenshotsParams
  ): Promise<ServiceResult<GameScreenshotsResult>> {
    try {
      // 1. Input validation
      if (!params.gameId || params.gameId <= 0) {
        this.logger.warn(
          { gameId: params.gameId },
          "Invalid game ID provided for screenshots fetch"
        );
        return this.error(
          "Valid game ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { gameId } = params;

      this.logger.info({ gameId }, "Fetching game screenshots");

      // 2. Build query
      const query = new QueryBuilder()
        .fields(["id", "game", "image_id", "url", "width", "height"])
        .where(`game = ${gameId}`)
        .limit(50)
        .build();

      // 3. Make API request
      const response = await this.makeRequest<
        Array<{
          id: number;
          game: number;
          image_id: string;
          url?: string;
          width?: number;
          height?: number;
        }>
      >({
        body: query,
        resource: "/screenshots",
      });

      // 4. Handle error response (undefined means API error occurred)
      if (response === undefined) {
        this.logger.error("Failed to fetch game screenshots from IGDB API");
        return this.error(
          "Failed to fetch game screenshots",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      // 5. Handle empty response (NOT an error - games can have zero screenshots)
      if (response.length === 0) {
        this.logger.info({ gameId }, "No screenshots found for game");
        return this.success({
          screenshots: [],
        });
      }

      // 6. Return success
      this.logger.info(
        { gameId, count: response.length },
        "Successfully fetched game screenshots"
      );

      return this.success({
        screenshots: response,
      });
    } catch (error) {
      // 7. Catch-all error handling
      this.logger.error(
        { error, gameId: params.gameId },
        "Error fetching game screenshots"
      );
      return this.handleError(error, "Failed to fetch game screenshots");
    }
  }

  /**
   * Get aggregated rating for a game
   * Returns rating score and count of ratings from IGDB
   *
   * @param params - Parameters containing game ID
   * @returns ServiceResult with rating data
   */
  async getGameAggregatedRating(
    params: GetGameAggregatedRatingParams
  ): Promise<ServiceResult<GameAggregatedRatingResult>> {
    try {
      // 1. Input validation
      if (!params.gameId || params.gameId <= 0) {
        this.logger.warn(
          { gameId: params.gameId },
          "Invalid game ID provided for rating fetch"
        );
        return this.error(
          "Valid game ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { gameId } = params;

      this.logger.info({ gameId }, "Fetching game aggregated rating");

      // 2. Build query
      const query = new QueryBuilder()
        .fields(["id", "aggregated_rating", "aggregated_rating_count"])
        .where(`id = ${gameId}`)
        .limit(1)
        .build();

      // 3. Make API request
      const response = await this.makeRequest<
        Array<{
          id: number;
          aggregated_rating?: number;
          aggregated_rating_count?: number;
        }>
      >({
        body: query,
        resource: "/games",
      });

      // 4. Handle error response (undefined means API error occurred)
      if (response === undefined) {
        this.logger.error(
          "Failed to fetch game aggregated rating from IGDB API"
        );
        return this.error(
          "Failed to fetch game aggregated rating",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      // 5. Handle empty response (NOT_FOUND)
      if (response.length === 0) {
        this.logger.warn({ gameId }, "No game found with ID");
        return this.error(
          `No game found with ID ${gameId}`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      // 6. Return success (handle missing rating gracefully)
      const game = response[0];
      this.logger.info(
        {
          gameId,
          rating: game.aggregated_rating,
          count: game.aggregated_rating_count,
        },
        "Successfully fetched game aggregated rating"
      );

      return this.success({
        gameId: game.id,
        rating: game.aggregated_rating,
        count: game.aggregated_rating_count,
      });
    } catch (error) {
      // 7. Catch-all error handling
      this.logger.error(
        { error, gameId: params.gameId },
        "Error fetching game aggregated rating"
      );
      return this.handleError(error, "Failed to fetch game aggregated rating");
    }
  }

  /**
   * Get similar games for a specific game
   * Returns array of IGDB game IDs that are similar to the given game
   *
   * @param params - Parameters containing game ID
   * @returns ServiceResult with array of similar game IDs
   */
  async getSimilarGames(
    params: GetSimilarGamesParams
  ): Promise<ServiceResult<SimilarGamesResult>> {
    try {
      // 1. Input validation
      if (!params.gameId || params.gameId <= 0) {
        this.logger.warn(
          { gameId: params.gameId },
          "Invalid game ID provided for similar games fetch"
        );
        return this.error(
          "Valid game ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { gameId } = params;

      this.logger.info({ gameId }, "Fetching similar games");

      // 2. Build query
      const query = new QueryBuilder()
        .fields(["similar_games.*"])
        .where(`id = ${gameId}`)
        .build();

      // 3. Make API request
      const response = await this.makeRequest<
        Array<{
          id: number;
          similar_games?: number[];
        }>
      >({
        body: query,
        resource: "/games",
      });

      // 4. Handle error response (undefined means API error occurred)
      if (response === undefined) {
        this.logger.error("Failed to fetch similar games from IGDB API");
        return this.error(
          "Failed to fetch similar games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      // 5. Handle empty response or missing similar_games field (NOT an error)
      if (response.length === 0 || !response[0] || !response[0].similar_games) {
        this.logger.info({ gameId }, "No similar games found for game");
        return this.success({
          similarGames: [],
        });
      }

      // 6. Return success
      this.logger.info(
        { gameId, count: response[0].similar_games.length },
        "Successfully fetched similar games"
      );

      return this.success({
        similarGames: response[0].similar_games,
      });
    } catch (error) {
      // 7. Catch-all error handling
      this.logger.error(
        { error, gameId: params.gameId },
        "Error fetching similar games"
      );
      return this.handleError(error, "Failed to fetch similar games");
    }
  }

  /**
   * Retrieves the genres for a specific game
   * @param params - Contains the game ID
   * @returns ServiceResult with genres array or error
   */
  async getGameGenres(
    params: GetGameGenresParams
  ): Promise<ServiceResult<GameGenresResult>> {
    try {
      // 1. Input validation
      if (!params.gameId || params.gameId <= 0) {
        this.logger.warn(
          { gameId: params.gameId },
          "Invalid game ID provided for genres fetch"
        );
        return this.error(
          "Valid game ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { gameId } = params;

      this.logger.info({ gameId }, "Fetching game genres");

      // 2. Build query using QueryBuilder
      const query = new QueryBuilder()
        .fields(["genres.id", "genres.name"])
        .where(`id = ${gameId}`)
        .build();

      // 3. Make API request
      const response = await this.makeRequest<
        Array<{
          id: number;
          genres?: Array<{ id: number; name: string }>;
        }>
      >({
        body: query,
        resource: "/games",
      });

      // 4. Handle error response (undefined means API error occurred)
      if (response === undefined) {
        this.logger.error("Failed to fetch game genres from IGDB API");
        return this.error(
          "Failed to fetch game genres",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      // 5. Handle empty response or missing genres field (NOT an error)
      if (response.length === 0 || !response[0] || !response[0].genres) {
        this.logger.info({ gameId }, "No genres found for game");
        return this.success({
          genres: [],
        });
      }

      // 6. Return success
      this.logger.info(
        { gameId, count: response[0].genres.length },
        "Successfully fetched game genres"
      );

      return this.success({
        genres: response[0].genres,
      });
    } catch (error) {
      // 7. Catch-all error handling
      this.logger.error(
        { error, gameId: params.gameId },
        "Error fetching game genres"
      );
      return this.handleError(error, "Failed to fetch game genres");
    }
  }

  /**
   * Get completion times for a specific game
   * Returns time estimates for completing the game in different ways
   *
   * @param params - Parameters containing game ID
   * @returns ServiceResult with completion time data or null if not available
   */
  async getGameCompletionTimes(
    params: GetGameCompletionTimesParams
  ): Promise<ServiceResult<GameCompletionTimesResult>> {
    try {
      // 1. Input validation
      if (!params.gameId || params.gameId <= 0) {
        this.logger.warn(
          { gameId: params.gameId },
          "Invalid game ID provided for completion times fetch"
        );
        return this.error(
          "Valid game ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { gameId } = params;

      this.logger.info({ gameId }, "Fetching game completion times");

      // 2. Build query (replicate legacy behavior)
      const query = new QueryBuilder()
        .fields([
          "completeness",
          "created_at",
          "game",
          "gameplay_completionist",
          "gameplay_main",
          "gameplay_main_extra",
        ])
        .where(`game = ${gameId}`)
        .limit(1)
        .build();

      // 3. Make API request
      const response = await this.makeRequest<
        Array<{
          id: number;
          game_id?: number;
          gameplay_main?: number;
          gameplay_main_extra?: number;
          gameplay_completionist?: number;
          completeness?: number;
          created_at?: number;
        }>
      >({
        body: query,
        resource: "/game_time_to_beats",
      });

      // 4. Handle error response (undefined means API error occurred)
      if (response === undefined) {
        this.logger.error(
          "Failed to fetch game completion times from IGDB API"
        );
        return this.error(
          "Failed to fetch game completion times",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      // 5. Handle empty response (no completion time data)
      if (!response || response.length === 0) {
        this.logger.info({ gameId }, "No completion time data found for game");
        return this.success({
          completionTimes: null,
        });
      }

      // 6. Return success with first result
      this.logger.info(
        { gameId, hasData: true },
        "Successfully fetched game completion times"
      );

      return this.success({
        completionTimes: response[0],
      });
    } catch (error) {
      // 7. Catch-all error handling
      this.logger.error(
        { error, gameId: params.gameId },
        "Error fetching game completion times"
      );
      return this.handleError(error, "Failed to fetch game completion times");
    }
  }

  /**
   * Get expansions and DLCs for a specific game
   * Returns array of expansion/DLC items with details
   *
   * @param params - Parameters containing game ID
   * @returns ServiceResult with expansions array
   */
  async getGameExpansions(
    params: GetGameExpansionsParams
  ): Promise<ServiceResult<GameExpansionsResult>> {
    try {
      // 1. Input validation
      if (!params.gameId || params.gameId <= 0) {
        this.logger.warn(
          { gameId: params.gameId },
          "Invalid game ID provided for expansions fetch"
        );
        return this.error(
          "Valid game ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { gameId } = params;

      this.logger.info({ gameId }, "Fetching game expansions");

      // 2. Build query (replicate legacy logic)
      const query = new QueryBuilder()
        .fields([
          "expansions",
          "expansions.name",
          "expansions.cover.url",
          "expansions.cover.image_id",
          "expansions.release_dates",
        ])
        .where(`id = ${gameId}`)
        .build();

      // 3. Make API request
      const response = await this.makeRequest<
        Array<{
          id: number;
          expansions?: Array<{
            id: number;
            name: string;
            cover: {
              id: number;
              image_id: string;
              url?: string;
            };
            release_dates: Array<{
              id: number;
              human: string;
              platform: {
                id: number;
                name: string;
                human: string;
              };
            }>;
          }>;
        }>
      >({
        body: query,
        resource: "/games",
      });

      // 4. Handle error response (undefined means API error occurred)
      if (response === undefined) {
        this.logger.error("Failed to fetch game expansions from IGDB API");
        return this.error(
          "Failed to fetch game expansions",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      // 5. Handle empty response or missing expansions field (NOT an error)
      if (
        !response ||
        response.length === 0 ||
        !response[0] ||
        !response[0].expansions
      ) {
        this.logger.info({ gameId }, "No expansions found for game");
        return this.success({
          expansions: [],
        });
      }

      // 6. Return success
      this.logger.info(
        { gameId, count: response[0].expansions.length },
        "Successfully fetched game expansions"
      );

      return this.success({
        expansions: response[0].expansions,
      });
    } catch (error) {
      // 7. Catch-all error handling
      this.logger.error(
        { error, gameId: params.gameId },
        "Error fetching game expansions"
      );
      return this.handleError(error, "Failed to fetch game expansions");
    }
  }
}
