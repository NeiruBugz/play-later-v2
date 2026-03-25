import { env } from "@/env.mjs";
import { z } from "zod";

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
import { RequestOptions, TwitchTokenResponse } from "@/shared/types";

import {
  handleServiceError,
  serviceError,
  ServiceErrorCode,
  serviceSuccess,
  type ServiceResult,
} from "../types";
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
  ArtworkItemSchema,
  CollectionGamesByIdSchema,
  CollectionWithGamesSchema,
  EventItemSchema,
  EventLogoItemSchema,
  EventLogoSchema,
  FranchiseDetailsSchema,
  FranchiseGameItemSchema,
  FranchiseGamesSchema,
  FranchiseItemSchema,
  FullGameInfoResponseSchema,
  GameAggregatedRatingSchema,
  GameArtworksSchema,
  GameBySteamAppIdItemSchema,
  GameCompletionTimesItemSchema,
  GameDetailsBySlugSchema,
  GameDetailsSchema,
  GameExpansionsSchema,
  GameGenresSchema,
  GameScreenshotsSchema,
  GameSearchSchema,
  GameWithExpansionsSchema,
  GameWithGenresSchema,
  GameWithRatingSchema,
  GameWithSimilarSchema,
  GetGameBySteamAppIdSchema,
  GetGameCompletionTimesSchema,
  PlatformItemSchema,
  PlatformSearchSchema,
  ScreenshotItemSchema,
  SearchResponseItemSchema,
  SimilarGamesSchema,
  TimesToBeatItemSchema,
  TimesToBeatSchema,
  TopRatedGameItemSchema,
  UpcomingReleaseItemSchema,
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

export class IgdbService implements IgdbServiceInterface {
  private token: TwitchTokenResponse | null = null;
  private tokenExpiry: number = 0;

  constructor() {
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
      return token;
    } catch (thrown) {
      logger.error({ error: thrown }, "Error requesting Twitch token");
      handleServiceError(thrown);
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
        handleServiceError(
          new Error("Unauthorized: No valid token available.")
        );
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

        if (response.status === 429) {
          throw new Error("IGDB_RATE_LIMITED");
        }

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
      handleServiceError(thrown);
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
        { errors: result.error.issues, resource: options.resource },
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
        { errors: validation.error.issues },
        "Game search validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Invalid search parameters",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { name, offset, fields } = validation.data;

    try {
      const filterConditions = this.buildSearchFilterConditions(fields ?? {});
      const normalizedSearchQuery = normalizeGameTitle(normalizeString(name));

      const query = buildGameSearchQuery({
        searchQuery: normalizedSearchQuery,
        filterConditions,
        offset,
      });

      const games = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(SearchResponseItemSchema)
      );

      if (!games) {
        logger.warn({ searchQuery: name }, "No games found in search");
        return serviceError("Failed to find games", ServiceErrorCode.NOT_FOUND);
      }

      return serviceSuccess({
        games,
        count: games.length,
      });
    } catch (error) {
      logger.error({ error, searchQuery: name }, "Error searching games");
      if (error instanceof Error && error.message === "IGDB_RATE_LIMITED") {
        return serviceError(
          "IGDB API rate limit exceeded. Please try again in a moment.",
          ServiceErrorCode.IGDB_RATE_LIMITED
        );
      }
      return handleServiceError(error, "Failed to find games");
    }
  }

  async getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResult<GameDetailsResult>> {
    const validation = GameDetailsSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, gameId: params.gameId },
        "Game details validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      const query = buildGameDetailsByIdQuery(gameId);

      const resultGame = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(FullGameInfoResponseSchema)
      );

      if (resultGame && resultGame[0]) {
        return serviceSuccess({
          game: resultGame[0],
        });
      } else {
        logger.warn({ gameId }, "Game not found");
        throw new Error("Game not found");
      }
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game details");
      if (error instanceof Error && error.message === "IGDB_RATE_LIMITED") {
        return serviceError(
          "IGDB API rate limit exceeded. Please try again in a moment.",
          ServiceErrorCode.IGDB_RATE_LIMITED
        );
      }
      return handleServiceError(error, "Failed to fetch game details");
    }
  }

  async getGameDetailsBySlug(
    params: GetGameDetailsBySlugParams
  ): Promise<ServiceResult<GameDetailsBySlugResult>> {
    const validation = GameDetailsBySlugSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, slug: params.slug },
        "Game details by slug validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid game slug is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { slug } = validation.data;

    try {
      const query = buildGameDetailsBySlugQuery(slug);

      const resultGame = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(FullGameInfoResponseSchema)
      );

      if (!resultGame || resultGame.length === 0) {
        logger.warn({ slug }, "Game not found by slug");
        return serviceError("Game not found", ServiceErrorCode.NOT_FOUND);
      }

      return serviceSuccess({
        game: resultGame[0],
      });
    } catch (error) {
      logger.error({ error, slug }, "Error fetching game details by slug");
      return handleServiceError(error, "Failed to fetch game by slug");
    }
  }

  async getPlatforms(): Promise<ServiceResult<PlatformsResult>> {
    try {
      const query = buildPlatformsQuery();
      const platforms = await this.makeValidatedRequest(
        { body: query, resource: "/platforms" },
        z.array(PlatformItemSchema)
      );

      if (!platforms) {
        return serviceError(
          "Failed to fetch platforms",
          ServiceErrorCode.NOT_FOUND
        );
      }

      return serviceSuccess({
        platforms,
      });
    } catch (error) {
      return handleServiceError(error, "Failed to fetch platforms");
    }
  }

  async getGameBySteamAppId(
    params: GetGameBySteamAppIdParams
  ): Promise<ServiceResult<GameBySteamAppIdResult>> {
    const validation = GetGameBySteamAppIdSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, steamAppId: params.steamAppId },
        "Steam app ID validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid Steam app ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { steamAppId } = validation.data;

    try {
      const query = buildGameBySteamAppIdQuery(steamAppId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(GameBySteamAppIdItemSchema)
      );

      if (!response || response.length === 0) {
        logger.warn({ steamAppId }, "No IGDB game found for Steam app ID");
        return serviceError(
          `No IGDB game found for Steam app ID ${steamAppId}`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      return serviceSuccess({
        game: response[0],
      });
    } catch (error) {
      logger.error(
        { error, steamAppId },
        "Error fetching game by Steam app ID"
      );
      return handleServiceError(error, "Failed to fetch game by Steam app ID");
    }
  }

  async getTopRatedGames(): Promise<ServiceResult<TopRatedGamesResult>> {
    try {
      const query = buildTopRatedGamesQuery();

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(TopRatedGameItemSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch top-rated games from IGDB API");
        return serviceError(
          "Failed to fetch top-rated games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        return serviceSuccess({
          games: [],
        });
      }

      return serviceSuccess({
        games: response,
      });
    } catch (error) {
      logger.error({ error }, "Error fetching top-rated games");
      return handleServiceError(error, "Failed to fetch top-rated games");
    }
  }

  async searchPlatformByName(
    params: SearchPlatformByNameParams
  ): Promise<ServiceResult<PlatformSearchResult>> {
    const validation = PlatformSearchSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, platformName: params.platformName },
        "Platform search validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ??
          "Platform name is required for search",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { platformName } = validation.data;

    try {
      const query = buildPlatformSearchQuery(platformName);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/platforms" },
        z.array(PlatformItemSchema)
      );

      if (response === undefined) {
        logger.error("Failed to search platforms from IGDB API");
        return serviceError(
          "Failed to search platforms",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        logger.warn({ platformName }, "No platforms found matching search");
        return serviceError(
          `No platforms found matching "${platformName}"`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      return serviceSuccess({
        platforms: response,
      });
    } catch (error) {
      logger.error({ error, platformName }, "Error searching platforms");
      return handleServiceError(error, "Failed to search platforms");
    }
  }

  async getGameScreenshots(
    params: GetGameScreenshotsParams
  ): Promise<ServiceResult<GameScreenshotsResult>> {
    const validation = GameScreenshotsSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, gameId: params.gameId },
        "Game screenshots validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      const query = buildScreenshotsQuery(gameId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/screenshots" },
        z.array(ScreenshotItemSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch game screenshots from IGDB API");
        return serviceError(
          "Failed to fetch game screenshots",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        return serviceSuccess({
          screenshots: [],
        });
      }

      return serviceSuccess({
        screenshots: response,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game screenshots");
      return handleServiceError(error, "Failed to fetch game screenshots");
    }
  }

  async getGameAggregatedRating(
    params: GetGameAggregatedRatingParams
  ): Promise<ServiceResult<GameAggregatedRatingResult>> {
    const validation = GameAggregatedRatingSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, gameId: params.gameId },
        "Game aggregated rating validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      const query = buildAggregatedRatingQuery(gameId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(GameWithRatingSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch game aggregated rating from IGDB API");
        return serviceError(
          "Failed to fetch game aggregated rating",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        logger.warn({ gameId }, "No game found with ID");
        return serviceError(
          `No game found with ID ${gameId}`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      const game = response[0];
      return serviceSuccess({
        gameId: game.id,
        rating: game.aggregated_rating,
        count: game.aggregated_rating_count,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game aggregated rating");
      return handleServiceError(
        error,
        "Failed to fetch game aggregated rating"
      );
    }
  }

  async getSimilarGames(
    params: GetSimilarGamesParams
  ): Promise<ServiceResult<SimilarGamesResult>> {
    const validation = SimilarGamesSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, gameId: params.gameId },
        "Similar games validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      const query = buildSimilarGamesQuery(gameId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(GameWithSimilarSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch similar games from IGDB API");
        return serviceError(
          "Failed to fetch similar games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      const similarGames = response[0]?.similar_games ?? [];

      if (response.length === 0 || !response[0] || similarGames.length === 0) {
        return serviceSuccess({
          similarGames: [],
        });
      }

      return serviceSuccess({
        similarGames,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching similar games");
      return handleServiceError(error, "Failed to fetch similar games");
    }
  }

  async getGameGenres(
    params: GetGameGenresParams
  ): Promise<ServiceResult<GameGenresResult>> {
    const validation = GameGenresSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, gameId: params.gameId },
        "Game genres validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      const query = buildGameGenresQuery(gameId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(GameWithGenresSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch game genres from IGDB API");
        return serviceError(
          "Failed to fetch game genres",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      const genres = response[0]?.genres ?? [];

      if (response.length === 0 || !response[0] || genres.length === 0) {
        return serviceSuccess({
          genres: [],
        });
      }

      return serviceSuccess({
        genres,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game genres");
      return handleServiceError(error, "Failed to fetch game genres");
    }
  }

  async getGameCompletionTimes(
    params: GetGameCompletionTimesParams
  ): Promise<ServiceResult<GameCompletionTimesResult>> {
    const validation = GetGameCompletionTimesSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, gameId: params.gameId },
        "Game completion times validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      const query = buildCompletionTimesQuery(gameId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/game_time_to_beats" },
        z.array(GameCompletionTimesItemSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch game completion times from IGDB API");
        return serviceError(
          "Failed to fetch game completion times",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (!response || response.length === 0) {
        return serviceSuccess({
          completionTimes: null,
        });
      }

      return serviceSuccess({
        completionTimes: response[0],
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game completion times");
      return handleServiceError(error, "Failed to fetch game completion times");
    }
  }

  async getGameExpansions(
    params: GetGameExpansionsParams
  ): Promise<ServiceResult<GameExpansionsResult>> {
    const validation = GameExpansionsSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, gameId: params.gameId },
        "Game expansions validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      const query = buildExpansionsQuery(gameId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(GameWithExpansionsSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch game expansions from IGDB API");
        return serviceError(
          "Failed to fetch game expansions",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      const expansions = response[0]?.expansions ?? [];

      if (
        !response ||
        response.length === 0 ||
        !response[0] ||
        expansions.length === 0
      ) {
        return serviceSuccess({
          expansions: [],
        });
      }

      return serviceSuccess({
        expansions,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game expansions");
      return handleServiceError(error, "Failed to fetch game expansions");
    }
  }

  async getFranchiseGames(
    params: GetFranchiseGamesParams
  ): Promise<ServiceResult<FranchiseGamesResult>> {
    const validation = FranchiseGamesSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues },
        "Franchise games validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Invalid franchise parameters",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const {
      franchiseId,
      currentGameId,
      limit: inputLimit,
      offset: inputOffset,
    } = validation.data;
    const limit = inputLimit ?? 20;
    const offset = inputOffset ?? 0;

    try {
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
        this.makeValidatedRequest(
          { body: gamesQuery, resource: "/games" },
          z.array(FranchiseGameItemSchema)
        ),
        this.makeValidatedRequest(
          { body: countQuery, resource: "/games" },
          z.array(z.object({ id: z.number() }))
        ),
      ]);

      if (gamesResponse === undefined || countResponse === undefined) {
        logger.error("Failed to fetch franchise games from IGDB API");
        return serviceError(
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

      return serviceSuccess({
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
      return handleServiceError(error, "Failed to fetch franchise games");
    }
  }

  async getFranchiseDetails(
    params: GetFranchiseDetailsParams
  ): Promise<ServiceResult<FranchiseDetailsResult>> {
    const validation = FranchiseDetailsSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, franchiseId: params.franchiseId },
        "Franchise details validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid franchise ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { franchiseId } = validation.data;

    try {
      const query = buildFranchiseDetailsQuery(franchiseId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/franchises" },
        z.array(FranchiseItemSchema)
      );

      if (response === undefined || response.length === 0) {
        logger.warn({ franchiseId }, "Franchise not found in IGDB");
        return serviceError("Franchise not found", ServiceErrorCode.NOT_FOUND);
      }

      return serviceSuccess({
        franchise: response[0],
      });
    } catch (error) {
      logger.error({ error, franchiseId }, "Error fetching franchise details");
      return handleServiceError(error, "Failed to fetch franchise details");
    }
  }

  async getGameArtworks(
    params: GetGameArtworksParams
  ): Promise<ServiceResult<GameArtworksResult>> {
    const validation = GameArtworksSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, gameId: params.gameId },
        "Game artworks validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { gameId } = validation.data;

    try {
      const query = buildArtworksQuery(gameId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/artworks" },
        z.array(ArtworkItemSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch game artworks from IGDB API");
        return serviceError(
          "Failed to fetch game artworks",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        return serviceSuccess({
          artworks: [],
        });
      }

      return serviceSuccess({
        artworks: response,
      });
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game artworks");
      return handleServiceError(error, "Failed to fetch game artworks");
    }
  }

  async getUpcomingReleasesByIds(
    params: GetUpcomingReleasesByIdsParams
  ): Promise<ServiceResult<UpcomingReleasesResult>> {
    const validation = UpcomingReleasesByIdsSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues },
        "Upcoming releases validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ??
          "At least one valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { ids } = validation.data;

    try {
      const query = buildUpcomingReleasesQuery(ids);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(UpcomingReleaseItemSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch upcoming releases from IGDB API");
        return serviceError(
          "Failed to fetch upcoming releases",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        return serviceSuccess({
          releases: [],
        });
      }

      return serviceSuccess({
        releases: response,
      });
    } catch (error) {
      logger.error({ error, ids }, "Error fetching upcoming releases");
      return handleServiceError(error, "Failed to fetch upcoming releases");
    }
  }

  async getUpcomingGamingEvents(): Promise<
    ServiceResult<UpcomingGamingEventsResult>
  > {
    try {
      const query = buildUpcomingEventsQuery();

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/events" },
        z.array(EventItemSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch upcoming gaming events from IGDB API");
        return serviceError(
          "Failed to fetch upcoming gaming events",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (response.length === 0) {
        return serviceSuccess({
          events: [],
        });
      }

      return serviceSuccess({
        events: response,
      });
    } catch (error) {
      logger.error({ error }, "Error fetching upcoming gaming events");
      return handleServiceError(
        error,
        "Failed to fetch upcoming gaming events"
      );
    }
  }

  async getEventLogo(
    params: GetEventLogoParams
  ): Promise<ServiceResult<EventLogoResult>> {
    const validation = EventLogoSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, logoId: params.logoId },
        "Event logo validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ??
          "Valid event logo ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { logoId } = validation.data;

    try {
      const query = buildEventLogoQuery(logoId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/event_logos" },
        z.array(EventLogoItemSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch event logo from IGDB API");
        return serviceError(
          "Failed to fetch event logo",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (!response || response.length === 0) {
        logger.warn({ logoId }, "Event logo not found");
        return serviceError(
          `Event logo with ID ${logoId} not found`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      return serviceSuccess({
        logo: response[0],
      });
    } catch (error) {
      logger.error({ error, logoId }, "Error fetching event logo");
      return handleServiceError(error, "Failed to fetch event logo");
    }
  }

  async getTimesToBeat(
    params: GetTimesToBeatParams
  ): Promise<ServiceResult<TimesToBeatResult>> {
    const validation = TimesToBeatSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, igdbId: params.igdbId },
        "Times to beat validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ?? "Valid game ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { igdbId } = validation.data;

    try {
      const query = buildTimesToBeatQuery(igdbId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/game_time_to_beats" },
        z.array(TimesToBeatItemSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch times to beat from IGDB API");
        return serviceError(
          "Failed to fetch times to beat",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (!response || response.length === 0) {
        return serviceSuccess({
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

      return serviceSuccess({
        timesToBeat: {
          mainStory,
          completionist,
        },
      });
    } catch (error) {
      logger.error({ error, igdbId }, "Error fetching times to beat");
      return handleServiceError(error, "Failed to fetch times to beat");
    }
  }

  async getCollectionGamesById(params: {
    collectionId: number;
  }): Promise<ServiceResult<CollectionGamesResult>> {
    const validation = CollectionGamesByIdSchema.safeParse(params);
    if (!validation.success) {
      logger.warn(
        { errors: validation.error.issues, collectionId: params.collectionId },
        "Collection games validation failed"
      );
      return serviceError(
        validation.error.issues[0]?.message ??
          "Valid collection ID is required",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    const { collectionId } = validation.data;

    try {
      const query = buildCollectionGamesQuery(collectionId);

      const response = await this.makeValidatedRequest(
        { body: query, resource: "/collections" },
        z.array(CollectionWithGamesSchema)
      );

      if (response === undefined) {
        logger.error("Failed to fetch collection games from IGDB API");
        return serviceError(
          "Failed to fetch collection games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      if (!Array.isArray(response) || response.length === 0) {
        logger.warn({ collectionId }, "Collection not found");
        return serviceError("Collection not found", ServiceErrorCode.NOT_FOUND);
      }

      return serviceSuccess(response[0]);
    } catch (error) {
      logger.error({ error, collectionId }, "Error fetching collection games");
      return handleServiceError(error, "Failed to fetch collection games");
    }
  }
}
