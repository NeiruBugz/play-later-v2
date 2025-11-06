import { isSuccessResult } from "@/data-access-layer/services";
import { IgdbService } from "@/data-access-layer/services/igdb";
import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { SearchGamesSchema } from "@/features/game-search/schemas";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "GameSearchAPI" });

/**
 * Cached game search function with 5-minute revalidation
 * Uses Next.js unstable_cache for server-side caching to reduce IGDB API calls
 */
const getCachedGameSearch = unstable_cache(
  async (query: string, offset: number) => {
    const igdbService = new IgdbService();
    return await igdbService.searchGamesByName({ name: query, offset });
  },
  ["game-search"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["game-search"],
  }
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const offset = parseInt(searchParams.get("offset") ?? "0") || 0;

    logger.info({ query, offset }, "Game search API request received");

    const validation = SearchGamesSchema.safeParse({ query, offset });
    if (!validation.success) {
      logger.warn(
        { query, offset, errors: validation.error },
        "Validation failed"
      );
      return NextResponse.json(
        { error: "Invalid search parameters" },
        { status: 400 }
      );
    }

    const { allowed, remaining } = checkRateLimit(request);
    if (!allowed) {
      logger.warn({ query }, "Rate limit exceeded");
      const response = NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
      response.headers.set("X-RateLimit-Limit", "20");
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("Retry-After", "3600");
      return response;
    }

    // Use cached search to reduce IGDB API calls
    const result = await getCachedGameSearch(
      validation.data.query,
      validation.data.offset
    );

    if (!isSuccessResult(result)) {
      logger.error(
        { err: result.error, code: result.code, query },
        "IGDB service error"
      );
      return NextResponse.json(
        {
          error:
            result.error ||
            "Game search is temporarily unavailable. Please try again later.",
        },
        { status: 500 }
      );
    }

    logger.info({ query, count: result.data.count }, "Search successful");

    const response = NextResponse.json(result.data);

    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Add rate limit headers for client visibility
    response.headers.set("X-RateLimit-Limit", "20");
    response.headers.set("X-RateLimit-Remaining", String(remaining));

    return response;
  } catch (error) {
    logger.error(
      { err: error, query: request.nextUrl.searchParams.get("q") },
      "Unexpected error in search API"
    );
    return NextResponse.json(
      {
        error:
          "Game search is temporarily unavailable. Please try again later.",
      },
      { status: 500 }
    );
  }
}
