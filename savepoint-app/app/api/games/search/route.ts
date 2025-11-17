import { gameSearchHandler } from "@/data-access-layer/handlers";
import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { GAME_SEARCH_CACHE_TTL_SECONDS } from "@/shared/constants";
import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "GameSearchAPI" });
const getCachedGameSearch = unstable_cache(
  async (query: string, offset: number, ip: string, headers: Headers) => {
    return await gameSearchHandler(
      { query, offset },
      {
        ip,
        headers,
        url: new URL(
          `http://localhost/api/games/search?q=${query}&offset=${offset}`
        ),
      }
    );
  },
  ["game-search"],
  {
    revalidate: GAME_SEARCH_CACHE_TTL_SECONDS,
    tags: ["game-search"],
  }
);
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") ?? "";
    const parsedOffset = parseInt(searchParams.get("offset") ?? "0", 10);
    const offset =
      Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
    // Extract request context
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const headers = request.headers;
    logger.info({ query, offset, ip }, "Game search API request received");
    // Use cached handler to reduce IGDB API calls
    const result = await getCachedGameSearch(query, offset, ip, headers);
    // Transform handler result to NextResponse
    if (!result.success) {
      const response = NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
      // Add any custom headers from handler (e.g., rate limit headers)
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          response.headers.set(key, String(value));
        });
      }
      return response;
    }
    const response = NextResponse.json(result.data, { status: result.status });
    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
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
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
