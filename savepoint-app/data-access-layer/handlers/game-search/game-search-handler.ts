import { isSuccessResult } from "@/data-access-layer/services";
import { IgdbService } from "@/data-access-layer/services/igdb";
import type { NextRequest } from "next/server";

import { SearchGamesSchema } from "@/features/game-search/schemas";
import { HTTP_STATUS } from "@/shared/config/http-codes";
import {
  DEFAULT_RATE_LIMIT_REQUESTS,
  RATE_LIMIT_RETRY_AFTER_SECONDS,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

import type { HandlerResult, RequestContext } from "../types";
import type { GameSearchHandlerInput, GameSearchHandlerOutput } from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "GameSearchHandler" });

export async function gameSearchHandler(
  input: GameSearchHandlerInput,
  context: RequestContext
): Promise<HandlerResult<GameSearchHandlerOutput>> {
  const { query, offset = 0 } = input;
  logger.info({ query, offset, ip: context.ip }, "Processing game search");

  const validation = SearchGamesSchema.safeParse({ query, offset });
  if (!validation.success) {
    logger.warn(
      { query, offset, errors: validation.error },
      "Input validation failed"
    );
    return {
      success: false,
      error: "Invalid search parameters",
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

  const rateLimitRequest = {
    headers: context.headers,
  } as unknown as NextRequest;
  const rateLimitResult = await checkRateLimit(rateLimitRequest);
  if (!rateLimitResult.allowed) {
    logger.warn({ query, ip: context.ip }, "Rate limit exceeded");
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

  const igdbService = new IgdbService();
  const result = await igdbService.searchGamesByName({
    name: validation.data.query,
    offset: validation.data.offset,
  });
  if (!isSuccessResult(result)) {
    logger.error(
      { err: result.error, code: result.code, query },
      "IGDB service error"
    );
    return {
      success: false,
      error:
        result.error ||
        "Game search is temporarily unavailable. Please try again later.",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
  logger.info(
    { query, count: result.data.count, remaining: rateLimitResult.remaining },
    "Search successful"
  );
  return {
    success: true,
    data: result.data,
    status: HTTP_STATUS.OK,
  };
}
