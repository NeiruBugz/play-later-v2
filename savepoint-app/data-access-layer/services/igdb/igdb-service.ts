import { z } from "zod";

import { SECONDS_PER_HOUR } from "@/shared/constants";
import { ALLOWED_GAME_CATEGORIES } from "@/shared/constants/game";
import {
  createLogger,
  LOGGER_CONTEXT,
  normalizeGameTitle,
  normalizeString,
} from "@/shared/lib";
import { ExternalServiceError, NotFoundError } from "@/shared/lib/errors";
import {
  IgdbAuthError,
  igdbFetch,
  IgdbHttpError,
  IgdbNetworkError,
  IgdbServerError,
  IgdbRateLimitError as IgdbTransportRateLimitError,
} from "@/shared/lib/igdb";
import type { RequestOptions } from "@/shared/types";

import { IgdbRateLimitError } from "./errors";
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
  CollectionWithGamesSchema,
  FranchiseGameItemSchema,
  FranchiseItemSchema,
  FullGameInfoResponseSchema,
  PlatformItemSchema,
  SearchResponseItemSchema,
  TimesToBeatItemSchema,
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
  IgdbServiceContract,
  PlatformsResult,
  TimesToBeatResult,
} from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "IgdbService" });

export class IgdbService implements IgdbServiceContract {
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

  private mapIgdbTransportError(
    error: unknown,
    fallbackMessage: string
  ): never {
    if (error instanceof IgdbTransportRateLimitError) {
      throw new IgdbRateLimitError(
        "IGDB rate limit exceeded. Please try again later.",
        {
          retryAfter: error.retryAfterMs
            ? error.retryAfterMs / 1000
            : undefined,
        }
      );
    }
    if (
      error instanceof IgdbAuthError ||
      error instanceof IgdbServerError ||
      error instanceof IgdbNetworkError ||
      error instanceof IgdbHttpError
    ) {
      throw new ExternalServiceError(fallbackMessage, { cause: error });
    }
    throw new ExternalServiceError(
      error instanceof Error ? error.message : fallbackMessage,
      { cause: error }
    );
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

  async searchGamesByName(params: GameSearchParams): Promise<GameSearchResult> {
    const { name, offset, fields } = params;

    const filterConditions = this.buildSearchFilterConditions(fields ?? {});
    const normalizedSearchQuery = normalizeGameTitle(normalizeString(name));

    const query = buildGameSearchQuery({
      searchQuery: normalizedSearchQuery,
      filterConditions,
      offset,
    });

    let games: z.infer<typeof SearchResponseItemSchema>[] | undefined;
    try {
      games = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(SearchResponseItemSchema)
      );
    } catch (error) {
      logger.error({ error, searchQuery: name }, "Error searching games");
      this.mapIgdbTransportError(error, "Failed to find games");
    }

    if (!games) {
      logger.warn({ searchQuery: name }, "No games found in search");
      throw new NotFoundError("Failed to find games", { searchQuery: name });
    }

    return {
      games,
      count: games.length,
    };
  }

  async getGameDetails(params: GameDetailsParams): Promise<GameDetailsResult> {
    const { gameId } = params;

    const query = buildGameDetailsByIdQuery(gameId);

    let resultGame: z.infer<typeof FullGameInfoResponseSchema>[] | undefined;
    try {
      resultGame = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(FullGameInfoResponseSchema)
      );
    } catch (error) {
      logger.error({ error, gameId }, "Error fetching game details");
      this.mapIgdbTransportError(error, "Failed to fetch game details");
    }

    if (resultGame && resultGame[0]) {
      return {
        game: resultGame[0],
      };
    }

    logger.warn({ gameId }, "Game not found");
    throw new NotFoundError("Game not found", { gameId });
  }

  async getGameDetailsBySlug(
    params: GetGameDetailsBySlugParams
  ): Promise<GameDetailsBySlugResult> {
    const { slug } = params;

    const query = buildGameDetailsBySlugQuery(slug);

    let resultGame: z.infer<typeof FullGameInfoResponseSchema>[] | undefined;
    try {
      resultGame = await this.makeValidatedRequest(
        { body: query, resource: "/games" },
        z.array(FullGameInfoResponseSchema)
      );
    } catch (error) {
      logger.error({ error, slug }, "Error fetching game details by slug");
      this.mapIgdbTransportError(error, "Failed to fetch game by slug");
    }

    if (!resultGame || resultGame.length === 0) {
      logger.warn({ slug }, "Game not found by slug");
      throw new NotFoundError("Game not found", { slug });
    }

    return {
      game: resultGame[0],
    };
  }

  async getPlatforms(): Promise<PlatformsResult> {
    const query = buildPlatformsQuery();

    let platforms: z.infer<typeof PlatformItemSchema>[] | undefined;
    try {
      platforms = await this.makeValidatedRequest(
        { body: query, resource: "/platforms" },
        z.array(PlatformItemSchema)
      );
    } catch (error) {
      this.mapIgdbTransportError(error, "Failed to fetch platforms");
    }

    if (!platforms) {
      throw new NotFoundError("Failed to fetch platforms");
    }

    return { platforms };
  }

  async getFranchiseGames(
    params: GetFranchiseGamesParams
  ): Promise<FranchiseGamesResult> {
    const {
      franchiseId,
      currentGameId,
      limit: inputLimit,
      offset: inputOffset,
    } = params;
    const limit = inputLimit ?? 20;
    const offset = inputOffset ?? 0;

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

    let gamesResponse: z.infer<typeof FranchiseGameItemSchema>[] | undefined;
    let countResponse: { id: number }[] | undefined;
    try {
      [gamesResponse, countResponse] = await Promise.all([
        this.makeValidatedRequest(
          { body: gamesQuery, resource: "/games" },
          z.array(FranchiseGameItemSchema)
        ),
        this.makeValidatedRequest(
          { body: countQuery, resource: "/games" },
          z.array(z.object({ id: z.number() }))
        ),
      ]);
    } catch (error) {
      logger.error({ error, franchiseId }, "Error fetching franchise games");
      this.mapIgdbTransportError(error, "Failed to fetch franchise games");
    }

    if (gamesResponse === undefined || countResponse === undefined) {
      logger.error("Failed to fetch franchise games from IGDB API");
      throw new ExternalServiceError("Failed to fetch franchise games", {
        franchiseId,
      });
    }

    const total = countResponse?.length ?? 0;
    const games = gamesResponse ?? [];

    if (games.length === 0 && offset === 0) {
      logger.warn(
        { franchiseId, currentGameId },
        "No games found for franchise - this might indicate the franchise field is not properly linked in IGDB"
      );
    }

    return {
      games,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + games.length < total,
      },
    };
  }

  async getFranchiseDetails(
    params: GetFranchiseDetailsParams
  ): Promise<FranchiseDetailsResult> {
    const { franchiseId } = params;

    const query = buildFranchiseDetailsQuery(franchiseId);

    let response: z.infer<typeof FranchiseItemSchema>[] | undefined;
    try {
      response = await this.makeValidatedRequest(
        { body: query, resource: "/franchises" },
        z.array(FranchiseItemSchema)
      );
    } catch (error) {
      logger.error({ error, franchiseId }, "Error fetching franchise details");
      this.mapIgdbTransportError(error, "Failed to fetch franchise details");
    }

    if (response === undefined || response.length === 0) {
      logger.warn({ franchiseId }, "Franchise not found in IGDB");
      throw new NotFoundError("Franchise not found", { franchiseId });
    }

    return {
      franchise: response[0],
    };
  }

  async getTimesToBeat(
    params: GetTimesToBeatParams
  ): Promise<TimesToBeatResult> {
    const { igdbId } = params;

    const query = buildTimesToBeatQuery(igdbId);

    let response: z.infer<typeof TimesToBeatItemSchema>[] | undefined;
    try {
      response = await this.makeValidatedRequest(
        { body: query, resource: "/game_time_to_beats" },
        z.array(TimesToBeatItemSchema)
      );
    } catch (error) {
      logger.error({ error, igdbId }, "Error fetching times to beat");
      this.mapIgdbTransportError(error, "Failed to fetch times to beat");
    }

    if (response === undefined) {
      logger.error("Failed to fetch times to beat from IGDB API");
      throw new ExternalServiceError("Failed to fetch times to beat", {
        igdbId,
      });
    }

    if (!response || response.length === 0) {
      return {
        timesToBeat: {},
      };
    }

    const data = response[0];
    const mainStory = data.normally
      ? Math.round(data.normally / SECONDS_PER_HOUR)
      : undefined;
    const completionist = data.completely
      ? Math.round(data.completely / SECONDS_PER_HOUR)
      : undefined;

    return {
      timesToBeat: {
        mainStory,
        completionist,
      },
    };
  }

  async getCollectionGamesById(params: {
    collectionId: number;
  }): Promise<CollectionGamesResult> {
    const { collectionId } = params;

    const query = buildCollectionGamesQuery(collectionId);

    let response: z.infer<typeof CollectionWithGamesSchema>[] | undefined;
    try {
      response = await this.makeValidatedRequest(
        { body: query, resource: "/collections" },
        z.array(CollectionWithGamesSchema)
      );
    } catch (error) {
      logger.error({ error, collectionId }, "Error fetching collection games");
      this.mapIgdbTransportError(error, "Failed to fetch collection games");
    }

    if (response === undefined) {
      logger.error("Failed to fetch collection games from IGDB API");
      throw new ExternalServiceError("Failed to fetch collection games", {
        collectionId,
      });
    }

    if (!Array.isArray(response) || response.length === 0) {
      logger.warn({ collectionId }, "Collection not found");
      throw new NotFoundError("Collection not found", { collectionId });
    }

    const collection = response[0];
    const allowedTypes = new Set<number>(ALLOWED_GAME_CATEGORIES);
    const filteredGames = collection.games.filter(
      (game) => game.game_type === undefined || allowedTypes.has(game.game_type)
    );

    return { ...collection, games: filteredGames };
  }
}
