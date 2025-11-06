import type { NextRequest } from "next/server";

import { isSuccessResult } from "@/data-access-layer/services";
import { IgdbService } from "@/data-access-layer/services/igdb";

import { SearchGamesSchema } from "@/features/game-search/schemas";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

import type { HandlerResult, RequestContext } from "../types";
import type {
  GameSearchHandlerInput,
  GameSearchHandlerOutput,
} from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "GameSearchHandler" });

/**
 * Game search handler
 *
 * Orchestrates game search requests by:
 * 1. Validating input parameters
 * 2. Checking rate limits
 * 3. Calling IGDB service
 * 4. Formatting response
 *
 * @param input - Search parameters (query, offset)
 * @param context - Request context (IP for rate limiting)
 * @returns Handler result with games data or error
 */
export async function gameSearchHandler(
  input: GameSearchHandlerInput,
  context: RequestContext
): Promise<HandlerResult<GameSearchHandlerOutput>> {
  const { query, offset = 0 } = input;

  logger.info({ query, offset, ip: context.ip }, "Processing game search");

  // Validate input
  const validation = SearchGamesSchema.safeParse({ query, offset });
  if (!validation.success) {
    logger.warn(
      { query, offset, errors: validation.error },
      "Input validation failed"
    );
    return {
      success: false,
      error: "Invalid search parameters",
      status: 400,
    };
  }

  // Check rate limiting
  // Create a minimal NextRequest-like object for rate limiting
  const rateLimitRequest = {
    headers: context.headers,
  } as unknown as NextRequest;

  const rateLimitResult = checkRateLimit(rateLimitRequest);

  if (!rateLimitResult.allowed) {
    logger.warn({ query, ip: context.ip }, "Rate limit exceeded");
    return {
      success: false,
      error: "Rate limit exceeded. Try again later.",
      status: 429,
      headers: {
        "X-RateLimit-Limit": "20",
        "X-RateLimit-Remaining": "0",
        "Retry-After": "3600",
      },
    };
  }

  // Call IGDB service
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
      status: 500,
    };
  }

  logger.info(
    { query, count: result.data.count, remaining: rateLimitResult.remaining },
    "Search successful"
  );

  return {
    success: true,
    data: result.data, // Already in correct shape: { games: SearchResponse[], count: number }
    status: 200,
  };
}
