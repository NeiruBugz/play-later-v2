import { IgdbService } from "@/data-access-layer/services";
import { IgdbRateLimitError } from "@/data-access-layer/services/igdb/errors";
import { cacheLife, cacheTag } from "next/cache";

import { SearchGamesSchema } from "@/features/game-search";
import { HTTP_STATUS } from "@/shared/config/http-codes";
import {
  DEFAULT_RATE_LIMIT_REQUESTS,
  RATE_LIMIT_RETRY_AFTER_SECONDS,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

import { mapErrorToHandlerResult } from "../map-error";
import type { HandlerResult, RequestContext } from "../types";
import type { IgdbSearchHandlerInput, IgdbSearchHandlerOutput } from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "igdb-search" });

const igdbService = new IgdbService();

const SEARCH_REVALIDATE_SECONDS = 300;

const normalizeQuery = (query: string): string => query.trim().toLowerCase();

async function getCachedIgdbSearch(
  normalizedQuery: string,
  offset: number
): Promise<IgdbSearchHandlerOutput> {
  "use cache";
  cacheLife({ revalidate: SEARCH_REVALIDATE_SECONDS });
  cacheTag("igdb:search", `igdb:search:${normalizedQuery}`);

  logger.info(
    { query: normalizedQuery, offset },
    "IGDB search cache miss - fetching from service"
  );

  return igdbService.searchGamesByName({
    name: normalizedQuery,
    offset,
  });
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
    const data = await getCachedIgdbSearch(normalizedQuery, offset);
    return {
      success: true,
      data,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    logger.error(
      { error, query: normalizedQuery, offset },
      "IGDB search failed"
    );

    if (error instanceof IgdbRateLimitError) {
      const retryAfter = error.context?.retryAfter as number | undefined;
      return {
        success: false,
        error: error.message,
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        ...(retryAfter
          ? { headers: { "Retry-After": String(retryAfter) } }
          : {}),
      };
    }

    return mapErrorToHandlerResult(error);
  }
}

export const igdbSearchHandler = {
  search,
};
