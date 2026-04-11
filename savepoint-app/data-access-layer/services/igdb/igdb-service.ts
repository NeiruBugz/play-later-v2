import { z } from "zod";

import { SECONDS_PER_HOUR } from "@/shared/constants";
import { ALLOWED_GAME_CATEGORIES } from "@/shared/constants/game";
import {
  createLogger,
  LOGGER_CONTEXT,
  normalizeGameTitle,
  normalizeString,
} from "@/shared/lib";
import {
  IgdbAuthError,
  igdbFetch,
  IgdbHttpError,
  IgdbNetworkError,
  IgdbRateLimitError,
  IgdbServerError,
} from "@/shared/lib/igdb";
import type { RequestOptions } from "@/shared/types";

import {
  handleServiceError,
  serviceError,
  ServiceErrorCode,
  serviceSuccess,
  type ServiceResult,
} from "../types";
import {
  buildCollectionGamesQuery,
  buildFranchiseDetailsQuery,
  buildFranchiseGamesCountQuery,
  buildFranchiseGamesQuery,
  buildGameDetailsByIdQuery,
  buildGameDetailsBySlugQuery,
  buildGameSearchQuery,
  buildPlatformsQuery,
  buildTimesToBeatQuery,
} from "./queries";
import {
  CollectionGamesByIdSchema,
  CollectionWithGamesSchema,
  FranchiseDetailsSchema,
  FranchiseGameItemSchema,
  FranchiseGamesSchema,
  FranchiseItemSchema,
  FullGameInfoResponseSchema,
  GameDetailsBySlugSchema,
  GameDetailsSchema,
  GameSearchSchema,
  PlatformItemSchema,
  SearchResponseItemSchema,
  TimesToBeatItemSchema,
  TimesToBeatSchema,
} from "./schemas";
import type {
  CollectionGamesResult,
  FranchiseDetailsResult,
  FranchiseGamesResult,
  GameDetailsBySlugResult,
  GameDetailsParams,
  GameDetailsResult,
  GameSearchParams,
  GameSearchResult,
  GetFranchiseDetailsParams,
  GetFranchiseGamesParams,
  GetGameDetailsBySlugParams,
  GetTimesToBeatParams,
  IgdbService as IgdbServiceInterface,
  PlatformsResult,
  TimesToBeatResult,
} from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "IgdbService" });

export class IgdbService implements IgdbServiceInterface {
  constructor() {
    logger.debug("IgdbService initialized");
  }

  private async makeValidatedRequest<T>(
    options: RequestOptions,
    schema: z.ZodType<T>
  ): Promise<T | undefined> {
    try {
      const response = await igdbFetch<unknown>(
        options.resource,
        options.body ?? ""
      );
      const parsed = schema.safeParse(response);
      if (!parsed.success) {
        logger.error(
          { errors: parsed.error.issues, resource: options.resource },
          "IGDB response validation failed"
        );
        return undefined;
      }
      return parsed.data;
    } catch (thrown) {
      logger.error(
        { error: thrown, resource: options.resource },
        "IGDB fetch failed"
      );
      throw thrown;
    }
  }

  private mapIgdbError(
    error: unknown,
    fallbackMessage: string
  ): ServiceResult<never> {
    if (error instanceof IgdbRateLimitError) {
      return serviceError(
        "IGDB rate limit exceeded. Please try again later.",
        ServiceErrorCode.IGDB_RATE_LIMITED
      );
    }
    if (error instanceof IgdbAuthError) {
      return serviceError(
        "IGDB authentication failed.",
        ServiceErrorCode.INTERNAL_ERROR
      );
    }
    if (
      error instanceof IgdbServerError ||
      error instanceof IgdbNetworkError ||
      error instanceof IgdbHttpError
    ) {
      return serviceError(fallbackMessage, ServiceErrorCode.INTERNAL_ERROR);
    }
    return handleServiceError(error, fallbackMessage);
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
      return this.mapIgdbError(error, "Failed to find games");
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
      return this.mapIgdbError(error, "Failed to fetch game details");
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
      return this.mapIgdbError(error, "Failed to fetch game by slug");
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
      return this.mapIgdbError(error, "Failed to fetch platforms");
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
      return this.mapIgdbError(error, "Failed to fetch franchise games");
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
      return this.mapIgdbError(error, "Failed to fetch franchise details");
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
      return this.mapIgdbError(error, "Failed to fetch times to beat");
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

      const collection = response[0];
      const allowedTypes = new Set<number>(ALLOWED_GAME_CATEGORIES);
      const filteredGames = collection.games.filter(
        (game) =>
          game.game_type === undefined || allowedTypes.has(game.game_type)
      );

      return serviceSuccess({ ...collection, games: filteredGames });
    } catch (error) {
      logger.error({ error, collectionId }, "Error fetching collection games");
      return this.mapIgdbError(error, "Failed to fetch collection games");
    }
  }
}
