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
  GameCategory,
  RequestOptions,
  TwitchTokenResponse,
  type SearchResponse,
} from "@/shared/types";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";
import {
  SEARCH_RESULTS_LIMIT,
  TOP_RATED_GAMES_LIMIT,
  UPCOMING_EVENTS_LIMIT,
} from "./constants";
import { QueryBuilder } from "./query-builder";
import type {
  EventLogoResult,
  FranchiseGamesResult,
  GameAggregatedRatingResult,
  GameArtworksResult,
  GameBySteamAppIdResult,
  GameCompletionTimesResult,
  GameDetailsParams,
  GameDetailsResult,
  GameExpansionsResult,
  GameGenresResult,
  GameScreenshotsResult,
  GameSearchParams,
  GameSearchResult,
  GetEventLogoParams,
  GetFranchiseGamesParams,
  GetGameAggregatedRatingParams,
  GetGameArtworksParams,
  GetGameBySteamAppIdParams,
  GetGameCompletionTimesParams,
  GetGameExpansionsParams,
  GetGameGenresParams,
  GetGameScreenshotsParams,
  GetSimilarGamesParams,
  GetUpcomingReleasesByIdsParams,
  IgdbService as IgdbServiceInterface,
  PlatformSearchResult,
  PlatformsResult,
  SearchPlatformByNameParams,
  SimilarGamesResult,
  TopRatedGamesResult,
  UpcomingGamingEventsResult,
  UpcomingReleasesResult,
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
      this.logger.error({ err: thrown }, "Error requesting Twitch token");
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
        { err: thrown, resource: options.resource },
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
          "game_type",
          "cover.image_id",
        ])
        .where(
          `cover.image_id != null & game_type = (${GameCategory.MAIN_GAME},${GameCategory.STANDALONE_EXPANSION},${GameCategory.REMAKE},${GameCategory.REMASTER},${GameCategory.PORT},${GameCategory.EXPANDED_GAME}) ${filters}`
        )
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
        { err: error, searchQuery: params.name },
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
        { err: error, gameId: params.gameId },
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

      const steamUrl = `https://store.steampowered.com/app/${steamAppId}`;
      const query = new QueryBuilder()
        .fields(["name"])
        .where(
          `external_games.category = 1 & external_games.url = "${steamUrl}"`
        )
        .limit(1)
        .build();

      const response = await this.makeRequest<
        Array<{ id: number; name: string }>
      >({
        body: query,
        resource: "/games",
      });

      if (!response || response.length === 0) {
        this.logger.warn({ steamAppId }, "No IGDB game found for Steam app ID");
        return this.error(
          `No IGDB game found for Steam app ID ${steamAppId}`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      this.logger.info(
        { steamAppId, gameId: response[0].id, gameName: response[0].name },
        "Game found by Steam app ID"
      );

      return this.success({
        game: response[0],
      });
    } catch (error) {
      this.logger.error(
        { err: error, steamAppId: params.steamAppId },
        "Error fetching game by Steam app ID"
      );
      return this.handleError(error, "Failed to fetch game by Steam app ID");
    }
  }

  async getTopRatedGames(): Promise<ServiceResult<TopRatedGamesResult>> {
    try {
      this.logger.info("Fetching top-rated games");

      const query = new QueryBuilder()
        .fields(["name", "cover.image_id", "aggregated_rating"])
        .where(
          `aggregated_rating_count > 20 & aggregated_rating != null & rating != null & game_type = ${GameCategory.MAIN_GAME}`
        )
        .sort("aggregated_rating", "desc")
        .limit(TOP_RATED_GAMES_LIMIT)
        .build();

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

      if (response === undefined) {
        this.logger.error("Failed to fetch top-rated games from IGDB API");
        return this.error(
          "Failed to fetch top-rated games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

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

      return this.success({
        games: response,
      });
    } catch (error) {
      this.logger.error({ err: error }, "Error fetching top-rated games");
      return this.handleError(error, "Failed to fetch top-rated games");
    }
  }

  async searchPlatformByName(
    params: SearchPlatformByNameParams
  ): Promise<ServiceResult<PlatformSearchResult>> {
    try {
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

      const query = new QueryBuilder()
        .fields(["id", "name", "abbreviation"])
        .search(platformName)
        .limit(10)
        .build();

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

      if (response === undefined) {
        this.logger.error("Failed to search platforms from IGDB API");
        return this.error(
          "Failed to search platforms",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

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

      this.logger.info(
        { platformName, count: response.length },
        "Platforms found successfully"
      );

      return this.success({
        platforms: response,
      });
    } catch (error) {
      this.logger.error(
        { err: error, platformName: params.platformName },
        "Error searching platforms"
      );
      return this.handleError(error, "Failed to search platforms");
    }
  }

  async getGameScreenshots(
    params: GetGameScreenshotsParams
  ): Promise<ServiceResult<GameScreenshotsResult>> {
    try {
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

      const query = new QueryBuilder()
        .fields(["id", "game", "image_id", "url", "width", "height"])
        .where(`game = ${gameId}`)
        .limit(50)
        .build();

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

      if (response === undefined) {
        this.logger.error("Failed to fetch game screenshots from IGDB API");
        return this.error(
          "Failed to fetch game screenshots",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        this.logger.info({ gameId }, "No screenshots found for game");
        return this.success({
          screenshots: [],
        });
      }

      this.logger.info(
        { gameId, count: response.length },
        "Successfully fetched game screenshots"
      );

      return this.success({
        screenshots: response,
      });
    } catch (error) {
      this.logger.error(
        { err: error, gameId: params.gameId },
        "Error fetching game screenshots"
      );
      return this.handleError(error, "Failed to fetch game screenshots");
    }
  }

  async getGameAggregatedRating(
    params: GetGameAggregatedRatingParams
  ): Promise<ServiceResult<GameAggregatedRatingResult>> {
    try {
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

      const query = new QueryBuilder()
        .fields(["id", "aggregated_rating", "aggregated_rating_count"])
        .where(`id = ${gameId}`)
        .limit(1)
        .build();

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

      if (response === undefined) {
        this.logger.error(
          "Failed to fetch game aggregated rating from IGDB API"
        );
        return this.error(
          "Failed to fetch game aggregated rating",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        this.logger.warn({ gameId }, "No game found with ID");
        return this.error(
          `No game found with ID ${gameId}`,
          ServiceErrorCode.NOT_FOUND
        );
      }

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
      this.logger.error(
        { err: error, gameId: params.gameId },
        "Error fetching game aggregated rating"
      );
      return this.handleError(error, "Failed to fetch game aggregated rating");
    }
  }

  async getSimilarGames(
    params: GetSimilarGamesParams
  ): Promise<ServiceResult<SimilarGamesResult>> {
    try {
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

      const query = new QueryBuilder()
        .fields(["similar_games.*"])
        .where(`id = ${gameId}`)
        .build();

      const response = await this.makeRequest<
        Array<{
          id: number;
          similar_games?: number[];
        }>
      >({
        body: query,
        resource: "/games",
      });

      if (response === undefined) {
        this.logger.error("Failed to fetch similar games from IGDB API");
        return this.error(
          "Failed to fetch similar games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0 || !response[0] || !response[0].similar_games) {
        this.logger.info({ gameId }, "No similar games found for game");
        return this.success({
          similarGames: [],
        });
      }

      this.logger.info(
        { gameId, count: response[0].similar_games.length },
        "Successfully fetched similar games"
      );

      return this.success({
        similarGames: response[0].similar_games,
      });
    } catch (error) {
      this.logger.error(
        { err: error, gameId: params.gameId },
        "Error fetching similar games"
      );
      return this.handleError(error, "Failed to fetch similar games");
    }
  }

  async getGameGenres(
    params: GetGameGenresParams
  ): Promise<ServiceResult<GameGenresResult>> {
    try {
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

      const query = new QueryBuilder()
        .fields(["genres.id", "genres.name"])
        .where(`id = ${gameId}`)
        .build();

      const response = await this.makeRequest<
        Array<{
          id: number;
          genres?: Array<{ id: number; name: string }>;
        }>
      >({
        body: query,
        resource: "/games",
      });

      if (response === undefined) {
        this.logger.error("Failed to fetch game genres from IGDB API");
        return this.error(
          "Failed to fetch game genres",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0 || !response[0] || !response[0].genres) {
        this.logger.info({ gameId }, "No genres found for game");
        return this.success({
          genres: [],
        });
      }

      this.logger.info(
        { gameId, count: response[0].genres.length },
        "Successfully fetched game genres"
      );

      return this.success({
        genres: response[0].genres,
      });
    } catch (error) {
      this.logger.error(
        { err: error, gameId: params.gameId },
        "Error fetching game genres"
      );
      return this.handleError(error, "Failed to fetch game genres");
    }
  }

  async getGameCompletionTimes(
    params: GetGameCompletionTimesParams
  ): Promise<ServiceResult<GameCompletionTimesResult>> {
    try {
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

      if (response === undefined) {
        this.logger.error(
          "Failed to fetch game completion times from IGDB API"
        );
        return this.error(
          "Failed to fetch game completion times",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (!response || response.length === 0) {
        this.logger.info({ gameId }, "No completion time data found for game");
        return this.success({
          completionTimes: null,
        });
      }

      this.logger.info(
        { gameId, hasData: true },
        "Successfully fetched game completion times"
      );

      return this.success({
        completionTimes: response[0],
      });
    } catch (error) {
      this.logger.error(
        { err: error, gameId: params.gameId },
        "Error fetching game completion times"
      );
      return this.handleError(error, "Failed to fetch game completion times");
    }
  }

  async getGameExpansions(
    params: GetGameExpansionsParams
  ): Promise<ServiceResult<GameExpansionsResult>> {
    try {
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

      if (response === undefined) {
        this.logger.error("Failed to fetch game expansions from IGDB API");
        return this.error(
          "Failed to fetch game expansions",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

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

      this.logger.info(
        { gameId, count: response[0].expansions.length },
        "Successfully fetched game expansions"
      );

      return this.success({
        expansions: response[0].expansions,
      });
    } catch (error) {
      this.logger.error(
        { err: error, gameId: params.gameId },
        "Error fetching game expansions"
      );
      return this.handleError(error, "Failed to fetch game expansions");
    }
  }

  async getFranchiseGames(
    params: GetFranchiseGamesParams
  ): Promise<ServiceResult<FranchiseGamesResult>> {
    try {
      if (!params.franchiseId || params.franchiseId <= 0) {
        this.logger.warn(
          { franchiseId: params.franchiseId },
          "Invalid franchise ID provided for franchise games fetch"
        );
        return this.error(
          "Valid franchise ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { franchiseId } = params;

      this.logger.info({ franchiseId }, "Fetching franchise games");

      const query = new QueryBuilder()
        .fields([
          "name",
          "id",
          "games.name",
          "games.cover.image_id",
          "games.game_type",
        ])
        .where(`id = ${franchiseId}`)
        .build();

      const response = await this.makeRequest<
        Array<{
          id: number;
          name: string;
          games?: Array<{
            id: number;
            name: string;
            cover: {
              id: number;
              image_id: string;
            };
            game_type: number;
          }>;
        }>
      >({
        body: query,
        resource: "/franchises",
      });

      if (response === undefined) {
        this.logger.error("Failed to fetch franchise games from IGDB API");
        return this.error(
          "Failed to fetch franchise games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (
        !response ||
        response.length === 0 ||
        !response[0] ||
        !response[0].games
      ) {
        this.logger.info({ franchiseId }, "No games found for franchise");
        return this.success({
          games: [],
        });
      }

      this.logger.info(
        { franchiseId, count: response[0].games.length },
        "Successfully fetched franchise games"
      );

      return this.success({
        games: response[0].games,
      });
    } catch (error) {
      this.logger.error(
        { err: error, franchiseId: params.franchiseId },
        "Error fetching franchise games"
      );
      return this.handleError(error, "Failed to fetch franchise games");
    }
  }

  async getGameArtworks(
    params: GetGameArtworksParams
  ): Promise<ServiceResult<GameArtworksResult>> {
    try {
      if (!params.gameId || params.gameId <= 0) {
        this.logger.warn(
          { gameId: params.gameId },
          "Invalid game ID provided for artworks fetch"
        );
        return this.error(
          "Valid game ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { gameId } = params;

      this.logger.info({ gameId }, "Fetching game artworks");

      const query = new QueryBuilder()
        .fields([
          "alpha_channel",
          "animated",
          "checksum",
          "game",
          "height",
          "image_id",
          "url",
          "width",
        ])
        .where(`game = ${gameId}`)
        .limit(50)
        .build();

      const response = await this.makeRequest<
        Array<{
          id: number;
          alpha_channel?: boolean;
          animated?: boolean;
          checksum: string;
          game: number;
          height?: number;
          image_id: string;
          url?: string;
          width?: number;
        }>
      >({
        body: query,
        resource: "/artworks",
      });

      if (response === undefined) {
        this.logger.error("Failed to fetch game artworks from IGDB API");
        return this.error(
          "Failed to fetch game artworks",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        this.logger.info({ gameId }, "No artworks found for game");
        return this.success({
          artworks: [],
        });
      }

      this.logger.info(
        { gameId, count: response.length },
        "Successfully fetched game artworks"
      );

      return this.success({
        artworks: response,
      });
    } catch (error) {
      this.logger.error(
        { err: error, gameId: params.gameId },
        "Error fetching game artworks"
      );
      return this.handleError(error, "Failed to fetch game artworks");
    }
  }

  async getUpcomingReleasesByIds(
    params: GetUpcomingReleasesByIdsParams
  ): Promise<ServiceResult<UpcomingReleasesResult>> {
    try {
      if (!params.ids || params.ids.length === 0) {
        this.logger.warn("Attempted to fetch releases with empty IDs array");
        return this.error(
          "At least one game ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      if (params.ids.some((id) => !id || id <= 0)) {
        this.logger.warn({ ids: params.ids }, "Invalid game IDs provided");
        return this.error(
          "All game IDs must be valid positive integers",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      this.logger.info(
        { ids: params.ids, count: params.ids.length },
        "Fetching upcoming releases"
      );

      const query = this.queryBuilder
        .fields([
          "name",
          "cover.image_id",
          "first_release_date",
          "release_dates.platform.name",
          "release_dates.human",
        ])
        .sort("first_release_date", "asc")
        .where(`id = (${params.ids.join(",")})`)
        .build();

      const response = await this.makeRequest<
        Array<{
          id: number;
          name: string;
          cover: {
            id: number;
            image_id: string;
          };
          first_release_date: number;
          release_dates: Array<{
            id: number;
            human: string;
            platform: {
              id: number;
              name: string;
              human: string;
            };
          }>;
        }>
      >({
        body: query,
        resource: "/games",
      });

      if (response === undefined) {
        this.logger.error("Failed to fetch upcoming releases from IGDB API");
        return this.error(
          "Failed to fetch upcoming releases",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        this.logger.info({ ids: params.ids }, "No upcoming releases found");
        return this.success({
          releases: [],
        });
      }

      this.logger.info(
        { ids: params.ids, count: response.length },
        "Successfully fetched upcoming releases"
      );

      return this.success({
        releases: response,
      });
    } catch (error) {
      this.logger.error(
        { err: error, ids: params.ids },
        "Error fetching upcoming releases"
      );
      return this.handleError(error, "Failed to fetch upcoming releases");
    }
  }

  async getUpcomingGamingEvents(): Promise<
    ServiceResult<UpcomingGamingEventsResult>
  > {
    try {
      this.logger.info("Fetching upcoming gaming events");

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const query = new QueryBuilder()
        .fields([
          "checksum",
          "created_at",
          "description",
          "end_time",
          "event_logo",
          "event_networks",
          "games",
          "live_stream_url",
          "name",
          "slug",
          "start_time",
          "time_zone",
          "updated_at",
          "videos",
        ])
        .where(`start_time >= ${currentTimestamp}`)
        .sort("start_time", "asc")
        .limit(UPCOMING_EVENTS_LIMIT)
        .build();

      const response = await this.makeRequest<
        Array<{
          id: number;
          name: string;
          checksum?: string;
          created_at?: number;
          description?: string;
          end_time?: number;
          event_logo?: number | { id: number };
          event_networks?: number[];
          games?: number[];
          live_stream_url?: string;
          slug?: string;
          start_time: number;
          time_zone?: string;
          updated_at?: number;
          videos?: number[];
        }>
      >({
        body: query,
        resource: "/events",
      });

      if (response === undefined) {
        this.logger.error(
          "Failed to fetch upcoming gaming events from IGDB API"
        );
        return this.error(
          "Failed to fetch upcoming gaming events",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        this.logger.info("No upcoming gaming events found");
        return this.success({
          events: [],
        });
      }

      this.logger.info(
        { count: response.length },
        "Successfully fetched upcoming gaming events"
      );

      return this.success({
        events: response,
      });
    } catch (error) {
      this.logger.error(
        { err: error },
        "Error fetching upcoming gaming events"
      );
      return this.handleError(error, "Failed to fetch upcoming gaming events");
    }
  }

  async getEventLogo(
    params: GetEventLogoParams
  ): Promise<ServiceResult<EventLogoResult>> {
    try {
      if (!params.logoId || params.logoId <= 0) {
        this.logger.warn(
          { logoId: params.logoId },
          "Invalid event logo ID provided"
        );
        return this.error(
          "Valid event logo ID is required",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const { logoId } = params;

      this.logger.info({ logoId }, "Fetching event logo");

      const query = new QueryBuilder()
        .fields(["id", "width", "height", "image_id"])
        .where(`id = ${logoId}`)
        .limit(1)
        .build();

      const response = await this.makeRequest<
        Array<{
          id: number;
          width?: number;
          height?: number;
          image_id: string;
        }>
      >({
        body: query,
        resource: "/event_logos",
      });

      if (response === undefined) {
        this.logger.error("Failed to fetch event logo from IGDB API");
        return this.error(
          "Failed to fetch event logo",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (!response || response.length === 0) {
        this.logger.warn({ logoId }, "Event logo not found");
        return this.error(
          `Event logo with ID ${logoId} not found`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      this.logger.info(
        { logoId, imageId: response[0].image_id },
        "Successfully fetched event logo"
      );

      return this.success({
        logo: response[0],
      });
    } catch (error) {
      this.logger.error(
        { err: error, logoId: params.logoId },
        "Error fetching event logo"
      );
      return this.handleError(error, "Failed to fetch event logo");
    }
  }
}
