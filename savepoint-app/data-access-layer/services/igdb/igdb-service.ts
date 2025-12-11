import { z } from "zod";

import { env } from "@/env.mjs";

import { API_URL, TOKEN_URL } from "@/shared/config/igdb";
import {
  SECONDS_PER_HOUR,
  TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS,
} from "@/shared/constants";
import {
  createLogger,
  getTimeStamp,
  LOGGER_CONTEXT,
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
import {
  buildAggregatedRatingQuery,
  buildArtworksQuery,
  buildCollectionGamesQuery,
  buildCompletionTimesQuery,
  buildEventLogoQuery,
  buildExpansionsQuery,
  buildFranchiseDetailsQuery,
  buildFranchiseGamesCountQuery,
  buildFranchiseGamesQuery,
  buildGameBySteamAppIdQuery,
  buildGameDetailsByIdQuery,
  buildGameDetailsBySlugQuery,
  buildGameGenresQuery,
  buildGameSearchQuery,
  buildPlatformSearchQuery,
  buildPlatformsQuery,
  buildScreenshotsQuery,
  buildSimilarGamesQuery,
  buildTimesToBeatQuery,
  buildTopRatedGamesQuery,
  buildUpcomingEventsQuery,
  buildUpcomingReleasesQuery,
} from "./queries";
import {
  CollectionGamesByIdSchema,
  EventLogoSchema,
  FranchiseDetailsSchema,
  FranchiseGamesSchema,
  GameAggregatedRatingSchema,
  GameArtworksSchema,
  GameDetailsBySlugSchema,
  GameDetailsSchema,
  GameExpansionsSchema,
  GameGenresSchema,
  GameScreenshotsSchema,
  GameSearchSchema,
  GetGameBySteamAppIdSchema,
  GetGameCompletionTimesSchema,
  PlatformSearchSchema,
  SimilarGamesSchema,
  TimesToBeatSchema,
  UpcomingReleasesByIdsSchema,
} from "./schemas";
import type {
  CollectionGamesResult,
  EventLogoResult,
  FranchiseDetailsResult,
  FranchiseGamesResult,
  GameAggregatedRatingResult,
  GameArtworksResult,
  GameBySteamAppIdResult,
  GameCompletionTimesResult,
  GameDetailsBySlugResult,
  GameDetailsParams,
  GameDetailsResult,
  GameExpansionsResult,
  GameGenresResult,
  GameScreenshotsResult,
  GameSearchParams,
  GameSearchResult,
  GetEventLogoParams,
  GetFranchiseDetailsParams,
  GetFranchiseGamesParams,
  GetGameAggregatedRatingParams,
  GetGameArtworksParams,
  GetGameBySteamAppIdParams,
  GetGameCompletionTimesParams,
  GetGameDetailsBySlugParams,
  GetGameExpansionsParams,
  GetGameGenresParams,
  GetGameScreenshotsParams,
  GetSimilarGamesParams,
  GetTimesToBeatParams,
  GetUpcomingReleasesByIdsParams,
  IgdbService as IgdbServiceInterface,
  PlatformSearchResult,
  PlatformsResult,
  SearchPlatformByNameParams,
  SimilarGamesResult,
  TimesToBeatResult,
  TopRatedGamesResult,
  UpcomingGamingEventsResult,
  UpcomingReleasesResult,
} from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "IgdbService" });

export class IgdbService extends BaseService implements IgdbServiceInterface {
  private token: TwitchTokenResponse | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    super();
    logger.debug("IgdbService initialized");
  }

  private async requestTwitchToken() {
    try {
      logger.debug("Requesting new Twitch access token");
      const res = await fetch(TOKEN_URL, {
        method: "POST",
      });
      if (!res.ok) {
        logger.error(
          { status: res.status, statusText: res.statusText },
          "Failed to fetch Twitch token"
        );
        throw new Error(`Failed to fetch token: ${res.statusText}`);
      }
      const token = (await res.json()) as unknown as TwitchTokenResponse;
      this.token = token;
      this.tokenExpiry =
        getTimeStamp() + token.expires_in - TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS;
      logger.info(
        { expiresIn: token.expires_in },
        "Twitch access token acquired"
      );
      return token;
    } catch (thrown) {
      logger.error({ error: thrown }, "Error requesting Twitch token");
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
      this.tokenExpiry =
        getTimeStamp() + token.expires_in - TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS;
      return token.access_token;
    }
    return null;
  }

  private async makeRequest<T>(
    options: RequestOptions
  ): Promise<T | undefined> {
    try {
      logger.debug({ resource: options.resource }, "Making IGDB API request");
      const accessToken = await this.getToken();
      if (accessToken === undefined) {
        logger.error("No valid access token available for IGDB request");
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
        logger.error(
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
      logger.debug(
        { resource: options.resource, status: response.status },
        "IGDB API request successful"
      );
      return (await response.json()) as unknown as T;
    } catch (thrown) {
      logger.error(
        { error: thrown, resource: options.resource },
        "Error making IGDB API request"
      );
      this.handleError(thrown);
      return undefined;
    }
  }

  private async makeValidatedRequest<T>(
    options: RequestOptions,
    schema: z.ZodType<T>
  ): Promise<T | undefined> {
    const response = await this.makeRequest<unknown>(options);
    if (response === undefined) return undefined;

    const result = schema.safeParse(response);
    if (!result.success) {
      logger.error(
        { errors: result.error.errors, resource: options.resource },
        "IGDB response validation failed"
      );
      return undefined;
    }
    return result.data;
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
    const validation = GameSearchSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors },
        "Game search validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Invalid search parameters",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { name, offset, fields } = validation.data;

    try {
      const filterConditions = this.buildSearchFilterConditions(fields ?? {});
      const normalizedSearchQuery = normalizeGameTitle(normalizeString(name));

      logger.info(
        {
          searchQuery: name,
          normalizedQuery: normalizedSearchQuery,
          filters: fields,
        },
        "Searching games by name"
      );

      const query = buildGameSearchQuery({
        searchQuery: normalizedSearchQuery,
        filterConditions,
        offset,
      });

      const games = await this.makeRequest<SearchResponse[]>({
        body: query,
        resource: "/games",
      });

      if (!games) {
        logger.warn({ searchQuery: name }, "No games found in search");
        return this.error("Failed to find games", ServiceErrorCode.NOT_FOUND);
      }

      logger.info(
        { searchQuery: name, resultCount: games.length },
        "Game search completed"
      );
      return this.success({
        games,
        count: games.length,
      });
    } catch (error) {
      logger.error({ error, searchQuery: name }, "Error searching games");
      return this.handleError(error, "Failed to find games");
    }
  }

  async getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResult<GameDetailsResult>> {
    const validation = GameDetailsSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, gameId: params.gameId },
        "Game details validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      logger.info({ gameId }, "Fetching game details");
      const query = buildGameDetailsByIdQuery(gameId);

      const resultGame = await this.makeRequest<FullGameInfoResponse[]>({
        body: query,
        resource: "/games",
      });

      if (resultGame && resultGame[0]) {
        logger.info(
          { gameId, gameName: resultGame[0].name },
          "Game details fetched successfully"
        );
        return this.success({
          game: resultGame[0],
        });
      } else {
        logger.warn({ gameId }, "Game not found");
        throw new Error("Game not found");
      }
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game details");
      return this.handleError(error, "Failed to fetch game details");
    }
  }

  async getGameDetailsBySlug(
    params: GetGameDetailsBySlugParams
  ): Promise<ServiceResult<GameDetailsBySlugResult>> {
    const validation = GameDetailsBySlugSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, slug: params.slug },
        "Game details by slug validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid game slug is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { slug } = validation.data;

    try {
      logger.info({ slug }, "Fetching game details by slug");
      const query = buildGameDetailsBySlugQuery(slug);

      const resultGame = await this.makeRequest<FullGameInfoResponse[]>({
        body: query,
        resource: "/games",
      });

      if (!resultGame || resultGame.length === 0) {
        logger.warn({ slug }, "Game not found by slug");
        return this.error("Game not found", ServiceErrorCode.NOT_FOUND);
      }

      logger.info(
        { slug, gameId: resultGame[0].id, gameName: resultGame[0].name },
        "Game details fetched successfully by slug"
      );
      return this.success({
        game: resultGame[0],
      });
    } catch (error) {
      logger.error({ error, slug }, "Error fetching game details by slug");
      return this.handleError(error, "Failed to fetch game by slug");
    }
  }

  async getPlatforms(): Promise<ServiceResult<PlatformsResult>> {
    try {
      const query = buildPlatformsQuery();
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
    const validation = GetGameBySteamAppIdSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, steamAppId: params.steamAppId },
        "Steam app ID validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid Steam app ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { steamAppId } = validation.data;

    try {
      logger.info({ steamAppId }, "Looking up game by Steam app ID");
      const query = buildGameBySteamAppIdQuery(steamAppId);

      const response = await this.makeRequest<
        Array<{ id: number; name: string }>
      >({
        body: query,
        resource: "/games",
      });

      if (!response || response.length === 0) {
        logger.warn({ steamAppId }, "No IGDB game found for Steam app ID");
        return this.error(
          `No IGDB game found for Steam app ID ${steamAppId}`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      logger.info(
        { steamAppId, gameId: response[0].id, gameName: response[0].name },
        "Game found by Steam app ID"
      );
      return this.success({
        game: response[0],
      });
    } catch (error) {
      logger.error({ error, steamAppId }, "Error fetching game by Steam app ID");
      return this.handleError(error, "Failed to fetch game by Steam app ID");
    }
  }

  async getTopRatedGames(): Promise<ServiceResult<TopRatedGamesResult>> {
    try {
      logger.info("Fetching top-rated games");
      const query = buildTopRatedGamesQuery();

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
        logger.error("Failed to fetch top-rated games from IGDB API");
        return this.error(
          "Failed to fetch top-rated games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        logger.info("No top-rated games found (empty response)");
        return this.success({
          games: [],
        });
      }

      logger.info(
        { count: response.length },
        "Top-rated games fetched successfully"
      );
      return this.success({
        games: response,
      });
    } catch (error) {
      logger.error({ error }, "Error fetching top-rated games");
      return this.handleError(error, "Failed to fetch top-rated games");
    }
  }

  async searchPlatformByName(
    params: SearchPlatformByNameParams
  ): Promise<ServiceResult<PlatformSearchResult>> {
    const validation = PlatformSearchSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, platformName: params.platformName },
        "Platform search validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ??
          "Platform name is required for search",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { platformName } = validation.data;

    try {
      logger.info({ platformName }, "Searching platforms by name");
      const query = buildPlatformSearchQuery(platformName);

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
        logger.error("Failed to search platforms from IGDB API");
        return this.error(
          "Failed to search platforms",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        logger.warn({ platformName }, "No platforms found matching search");
        return this.error(
          `No platforms found matching "${platformName}"`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      logger.info(
        { platformName, count: response.length },
        "Platforms found successfully"
      );
      return this.success({
        platforms: response,
      });
    } catch (error) {
      logger.error({ error, platformName }, "Error searching platforms");
      return this.handleError(error, "Failed to search platforms");
    }
  }

  async getGameScreenshots(
    params: GetGameScreenshotsParams
  ): Promise<ServiceResult<GameScreenshotsResult>> {
    const validation = GameScreenshotsSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, gameId: params.gameId },
        "Game screenshots validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      logger.info({ gameId }, "Fetching game screenshots");
      const query = buildScreenshotsQuery(gameId);

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
        logger.error("Failed to fetch game screenshots from IGDB API");
        return this.error(
          "Failed to fetch game screenshots",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        logger.info({ gameId }, "No screenshots found for game");
        return this.success({
          screenshots: [],
        });
      }

      logger.info(
        { gameId, count: response.length },
        "Successfully fetched game screenshots"
      );
      return this.success({
        screenshots: response,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game screenshots");
      return this.handleError(error, "Failed to fetch game screenshots");
    }
  }

  async getGameAggregatedRating(
    params: GetGameAggregatedRatingParams
  ): Promise<ServiceResult<GameAggregatedRatingResult>> {
    const validation = GameAggregatedRatingSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, gameId: params.gameId },
        "Game aggregated rating validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      logger.info({ gameId }, "Fetching game aggregated rating");
      const query = buildAggregatedRatingQuery(gameId);

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
        logger.error("Failed to fetch game aggregated rating from IGDB API");
        return this.error(
          "Failed to fetch game aggregated rating",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        logger.warn({ gameId }, "No game found with ID");
        return this.error(
          `No game found with ID ${gameId}`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      const game = response[0];
      logger.info(
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
      logger.error({ error, gameId }, "Error fetching game aggregated rating");
      return this.handleError(error, "Failed to fetch game aggregated rating");
    }
  }

  async getSimilarGames(
    params: GetSimilarGamesParams
  ): Promise<ServiceResult<SimilarGamesResult>> {
    const validation = SimilarGamesSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, gameId: params.gameId },
        "Similar games validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      logger.info({ gameId }, "Fetching similar games");
      const query = buildSimilarGamesQuery(gameId);

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
        logger.error("Failed to fetch similar games from IGDB API");
        return this.error(
          "Failed to fetch similar games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0 || !response[0] || !response[0].similar_games) {
        logger.info({ gameId }, "No similar games found for game");
        return this.success({
          similarGames: [],
        });
      }

      logger.info(
        { gameId, count: response[0].similar_games.length },
        "Successfully fetched similar games"
      );
      return this.success({
        similarGames: response[0].similar_games,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching similar games");
      return this.handleError(error, "Failed to fetch similar games");
    }
  }

  async getGameGenres(
    params: GetGameGenresParams
  ): Promise<ServiceResult<GameGenresResult>> {
    const validation = GameGenresSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, gameId: params.gameId },
        "Game genres validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      logger.info({ gameId }, "Fetching game genres");
      const query = buildGameGenresQuery(gameId);

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
        logger.error("Failed to fetch game genres from IGDB API");
        return this.error(
          "Failed to fetch game genres",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0 || !response[0] || !response[0].genres) {
        logger.info({ gameId }, "No genres found for game");
        return this.success({
          genres: [],
        });
      }

      logger.info(
        { gameId, count: response[0].genres.length },
        "Successfully fetched game genres"
      );
      return this.success({
        genres: response[0].genres,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game genres");
      return this.handleError(error, "Failed to fetch game genres");
    }
  }

  async getGameCompletionTimes(
    params: GetGameCompletionTimesParams
  ): Promise<ServiceResult<GameCompletionTimesResult>> {
    const validation = GetGameCompletionTimesSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, gameId: params.gameId },
        "Game completion times validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      logger.info({ gameId }, "Fetching game completion times");
      const query = buildCompletionTimesQuery(gameId);

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
        logger.error("Failed to fetch game completion times from IGDB API");
        return this.error(
          "Failed to fetch game completion times",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (!response || response.length === 0) {
        logger.info({ gameId }, "No completion time data found for game");
        return this.success({
          completionTimes: null,
        });
      }

      logger.info(
        { gameId, hasData: true },
        "Successfully fetched game completion times"
      );
      return this.success({
        completionTimes: response[0],
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game completion times");
      return this.handleError(error, "Failed to fetch game completion times");
    }
  }

  async getGameExpansions(
    params: GetGameExpansionsParams
  ): Promise<ServiceResult<GameExpansionsResult>> {
    const validation = GameExpansionsSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, gameId: params.gameId },
        "Game expansions validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      logger.info({ gameId }, "Fetching game expansions");
      const query = buildExpansionsQuery(gameId);

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
        logger.error("Failed to fetch game expansions from IGDB API");
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
        logger.info({ gameId }, "No expansions found for game");
        return this.success({
          expansions: [],
        });
      }

      logger.info(
        { gameId, count: response[0].expansions.length },
        "Successfully fetched game expansions"
      );
      return this.success({
        expansions: response[0].expansions,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game expansions");
      return this.handleError(error, "Failed to fetch game expansions");
    }
  }

  async getFranchiseGames(
    params: GetFranchiseGamesParams
  ): Promise<ServiceResult<FranchiseGamesResult>> {
    const validation = FranchiseGamesSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors },
        "Franchise games validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Invalid franchise parameters",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { franchiseId, currentGameId, limit: inputLimit, offset: inputOffset } = validation.data;
    const limit = inputLimit ?? 20;
    const offset = inputOffset ?? 0;

    try {
      logger.info(
        { franchiseId, currentGameId, limit, offset },
        "Fetching franchise games from IGDB"
      );

      const gamesQuery = buildFranchiseGamesQuery({
        franchiseId,
        currentGameId,
        limit,
        offset,
      });
      const countQuery = buildFranchiseGamesCountQuery({
        franchiseId,
        currentGameId,
      });

      logger.debug(
        { gamesQuery, countQuery, franchiseId },
        "IGDB franchise games queries"
      );

      const [gamesResponse, countResponse] = await Promise.all([
        this.makeRequest<
          Array<{
            id: number;
            name: string;
            slug: string;
            cover?: {
              image_id: string;
            };
          }>
        >({
          body: gamesQuery,
          resource: "/games",
        }),
        this.makeRequest<Array<{ id: number }>>({
          body: countQuery,
          resource: "/games",
        }),
      ]);

      if (gamesResponse === undefined || countResponse === undefined) {
        logger.error("Failed to fetch franchise games from IGDB API");
        return this.error(
          "Failed to fetch franchise games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      const total = countResponse?.length ?? 0;
      const games = gamesResponse ?? [];

      if (games.length === 0 && offset === 0) {
        logger.warn(
          { franchiseId, currentGameId },
          "No games found for franchise - this might indicate the franchise field is not properly linked in IGDB"
        );
      }

      logger.info(
        { franchiseId, gamesCount: games.length, total, offset, limit },
        "Franchise games fetched successfully"
      );

      return this.success({
        games,
        pagination: {
          total,
          offset,
          limit,
          hasMore: offset + games.length < total,
        },
      });
    } catch (error) {
      logger.error({ error, franchiseId }, "Error fetching franchise games");
      return this.handleError(error, "Failed to fetch franchise games");
    }
  }

  async getFranchiseDetails(
    params: GetFranchiseDetailsParams
  ): Promise<ServiceResult<FranchiseDetailsResult>> {
    const validation = FranchiseDetailsSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, franchiseId: params.franchiseId },
        "Franchise details validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid franchise ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { franchiseId } = validation.data;

    try {
      logger.info({ franchiseId }, "Fetching franchise details from IGDB");
      const query = buildFranchiseDetailsQuery(franchiseId);

      const response = await this.makeRequest<
        Array<{
          id: number;
          name: string;
        }>
      >({
        body: query,
        resource: "/franchises",
      });

      if (response === undefined || response.length === 0) {
        logger.warn({ franchiseId }, "Franchise not found in IGDB");
        return this.error("Franchise not found", ServiceErrorCode.NOT_FOUND);
      }

      logger.info(
        { franchiseId, franchiseName: response[0].name },
        "Franchise details fetched successfully"
      );
      return this.success({
        franchise: response[0],
      });
    } catch (error) {
      logger.error({ error, franchiseId }, "Error fetching franchise details");
      return this.handleError(error, "Failed to fetch franchise details");
    }
  }

  async getGameArtworks(
    params: GetGameArtworksParams
  ): Promise<ServiceResult<GameArtworksResult>> {
    const validation = GameArtworksSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, gameId: params.gameId },
        "Game artworks validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      logger.info({ gameId }, "Fetching game artworks");
      const query = buildArtworksQuery(gameId);

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
        logger.error("Failed to fetch game artworks from IGDB API");
        return this.error(
          "Failed to fetch game artworks",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        logger.info({ gameId }, "No artworks found for game");
        return this.success({
          artworks: [],
        });
      }

      logger.info(
        { gameId, count: response.length },
        "Successfully fetched game artworks"
      );
      return this.success({
        artworks: response,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game artworks");
      return this.handleError(error, "Failed to fetch game artworks");
    }
  }

  async getUpcomingReleasesByIds(
    params: GetUpcomingReleasesByIdsParams
  ): Promise<ServiceResult<UpcomingReleasesResult>> {
    const validation = UpcomingReleasesByIdsSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors },
        "Upcoming releases validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ??
          "At least one valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { ids } = validation.data;

    try {
      logger.info({ ids, count: ids.length }, "Fetching upcoming releases");
      const query = buildUpcomingReleasesQuery(ids);

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
        logger.error("Failed to fetch upcoming releases from IGDB API");
        return this.error(
          "Failed to fetch upcoming releases",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        logger.info({ ids }, "No upcoming releases found");
        return this.success({
          releases: [],
        });
      }

      logger.info(
        { ids, count: response.length },
        "Successfully fetched upcoming releases"
      );
      return this.success({
        releases: response,
      });
    } catch (error) {
      logger.error({ error, ids }, "Error fetching upcoming releases");
      return this.handleError(error, "Failed to fetch upcoming releases");
    }
  }

  async getUpcomingGamingEvents(): Promise<
    ServiceResult<UpcomingGamingEventsResult>
  > {
    try {
      logger.info("Fetching upcoming gaming events");
      const query = buildUpcomingEventsQuery();

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
        logger.error("Failed to fetch upcoming gaming events from IGDB API");
        return this.error(
          "Failed to fetch upcoming gaming events",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        logger.info("No upcoming gaming events found");
        return this.success({
          events: [],
        });
      }

      logger.info(
        { count: response.length },
        "Successfully fetched upcoming gaming events"
      );
      return this.success({
        events: response,
      });
    } catch (error) {
      logger.error({ error }, "Error fetching upcoming gaming events");
      return this.handleError(error, "Failed to fetch upcoming gaming events");
    }
  }

  async getEventLogo(
    params: GetEventLogoParams
  ): Promise<ServiceResult<EventLogoResult>> {
    const validation = EventLogoSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, logoId: params.logoId },
        "Event logo validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid event logo ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { logoId } = validation.data;

    try {
      logger.info({ logoId }, "Fetching event logo");
      const query = buildEventLogoQuery(logoId);

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
        logger.error("Failed to fetch event logo from IGDB API");
        return this.error(
          "Failed to fetch event logo",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (!response || response.length === 0) {
        logger.warn({ logoId }, "Event logo not found");
        return this.error(
          `Event logo with ID ${logoId} not found`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      logger.info(
        { logoId, imageId: response[0].image_id },
        "Successfully fetched event logo"
      );
      return this.success({
        logo: response[0],
      });
    } catch (error) {
      logger.error({ error, logoId }, "Error fetching event logo");
      return this.handleError(error, "Failed to fetch event logo");
    }
  }

  async getTimesToBeat(
    params: GetTimesToBeatParams
  ): Promise<ServiceResult<TimesToBeatResult>> {
    const validation = TimesToBeatSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, igdbId: params.igdbId },
        "Times to beat validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { igdbId } = validation.data;

    try {
      logger.info({ igdbId }, "Fetching times to beat");
      const query = buildTimesToBeatQuery(igdbId);

      const response = await this.makeRequest<
        Array<{
          id: number;
          normally?: number;
          completely?: number;
        }>
      >({
        body: query,
        resource: "/game_time_to_beats",
      });

      if (response === undefined) {
        logger.error("Failed to fetch times to beat from IGDB API");
        return this.error(
          "Failed to fetch times to beat",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (!response || response.length === 0) {
        logger.info({ igdbId }, "No times to beat data found for game");
        return this.success({
          timesToBeat: {},
        });
      }

      const data = response[0];
      const mainStory = data.normally
        ? Math.round(data.normally / SECONDS_PER_HOUR)
        : undefined;
      const completionist = data.completely
        ? Math.round(data.completely / SECONDS_PER_HOUR)
        : undefined;

      logger.info(
        { igdbId, mainStory, completionist },
        "Successfully fetched times to beat"
      );
      return this.success({
        timesToBeat: {
          mainStory,
          completionist,
        },
      });
    } catch (error) {
      logger.error({ error, igdbId }, "Error fetching times to beat");
      return this.handleError(error, "Failed to fetch times to beat");
    }
  }

  async getCollectionGamesById(params: {
    collectionId: number;
  }): Promise<ServiceResult<CollectionGamesResult>> {
    const validation = CollectionGamesByIdSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.errors, collectionId: params.collectionId },
        "Collection games validation failed"
      );
      return this.error(
        validation.error.errors[0]?.message ?? "Valid collection ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { collectionId } = validation.data;

    try {
      logger.info({ collectionId }, "Fetching collection games");
      const query = buildCollectionGamesQuery(collectionId);

      const response = await this.makeRequest<CollectionGamesResult[]>({
        body: query,
        resource: "/collections",
      });

      if (response === undefined) {
        logger.error("Failed to fetch collection games from IGDB API");
        return this.error(
          "Failed to fetch collection games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (!Array.isArray(response) || response.length === 0) {
        logger.info({ collectionId }, "No games found for collection");
        return this.success({
          name: "",
          id: 0,
          games: [],
        });
      }

      logger.info(
        { collectionId, gamesCount: response[0].games?.length ?? 0 },
        "Successfully fetched collection games"
      );
      return this.success(response[0]);
    } catch (error) {
      logger.error({ error, collectionId }, "Error fetching collection games");
      return this.handleError(error, "Failed to fetch collection games");
    }
  }
}
