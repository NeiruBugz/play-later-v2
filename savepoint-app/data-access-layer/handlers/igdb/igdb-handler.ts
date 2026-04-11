import { IgdbService } from "@/data-access-layer/services";
import { ServiceErrorCode } from "@/data-access-layer/services/types";
import { unstable_cache } from "next/cache";

import { SearchGamesSchema } from "@/features/game-search";
import { HTTP_STATUS } from "@/shared/config/http-codes";
import {
  DEFAULT_RATE_LIMIT_REQUESTS,
  RATE_LIMIT_RETRY_AFTER_SECONDS,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

import type { HandlerResult, RequestContext } from "../types";
import type { IgdbSearchHandlerInput, IgdbSearchHandlerOutput } from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "igdb-search" });

const igdbService = new IgdbService();

const SEARCH_REVALIDATE_SECONDS = 300;

const normalizeQuery = (query: string): string => query.trim().toLowerCase();

const getCachedIgdbSearch = (normalizedQuery: string, offset: number) =>
  unstable_cache(
    async (): Promise<IgdbSearchHandlerOutput> => {
      logger.info(
        { query: normalizedQuery, offset },
        "IGDB search cache miss - fetching from service"
      );

      const result = await igdbService.searchGamesByName({
        name: normalizedQuery,
        offset,
      });

      if (!result.success) {
        throw Object.assign(new Error(result.error), {
          code: result.code ?? ServiceErrorCode.INTERNAL_ERROR,
        });
      }

      return result.data;
    },
    ["igdb", "search", normalizedQuery, String(offset)],
    {
      revalidate: SEARCH_REVALIDATE_SECONDS,
      tags: ["igdb:search", `igdb:search:${normalizedQuery}`],
    }
  );

function mapServiceErrorCodeToStatus(code: ServiceErrorCode | undefined) {
  switch (code) {
    case ServiceErrorCode.VALIDATION_ERROR:
      return HTTP_STATUS.BAD_REQUEST;
    case ServiceErrorCode.NOT_FOUND:
      return HTTP_STATUS.NOT_FOUND;
    case ServiceErrorCode.IGDB_RATE_LIMITED:
    case ServiceErrorCode.RATE_LIMITED:
      return HTTP_STATUS.TOO_MANY_REQUESTS;
    default:
      return HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
}

async function search(
  input: IgdbSearchHandlerInput,
  context: RequestContext
): Promise<HandlerResult<IgdbSearchHandlerOutput>> {
  const validation = SearchGamesSchema.safeParse(input);
  if (!validation.success) {
    logger.warn(
      { errors: validation.error.issues, input },
      "IGDB search input validation failed"
    );
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid search parameters",
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

  const rateLimitResult = await checkRateLimit({
    headers: context.headers,
    ip: context.ip,
  });
  if (!rateLimitResult.allowed) {
    logger.warn({ ip: context.ip }, "IGDB search rate limit exceeded");
    return {
      success: false,
      error: "Rate limit exceeded. Try again later.",
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
      headers: {
        "X-RateLimit-Limit": String(DEFAULT_RATE_LIMIT_REQUESTS),
        "X-RateLimit-Remaining": "0",
        "Retry-After": String(RATE_LIMIT_RETRY_AFTER_SECONDS),
      },
    };
  }

  const normalizedQuery = normalizeQuery(validation.data.query);
  const offset = validation.data.offset;

  logger.info(
    { query: normalizedQuery, offset, ip: context.ip },
    "Processing IGDB search request"
  );

  try {
    const data = await getCachedIgdbSearch(normalizedQuery, offset)();
    return {
      success: true,
      data,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    const code = (error as { code?: ServiceErrorCode }).code;
    const message =
      error instanceof Error
        ? error.message
        : "Game search is temporarily unavailable. Please try again later.";
    const status = mapServiceErrorCodeToStatus(code);

    logger.error(
      { error, query: normalizedQuery, offset },
      "IGDB search failed"
    );

    return {
      success: false,
      error: message,
      status,
    };
  }
}

export const igdbSearchHandler = {
  search,
};
