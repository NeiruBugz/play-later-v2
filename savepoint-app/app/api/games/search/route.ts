import { IgdbService } from "@/data-access-layer/services";
import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { SearchGamesSchema } from "@/features/game-search/schemas";
import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "game-search" });

// Cache factory function - creates cached search with specific params
const getCachedIgdbSearch = (query: string, offset: number) =>
  unstable_cache(
    async () => {
      const igdbService = new IgdbService();
      const result = await igdbService.searchGamesByName({
        name: query,
        offset,
      });

      if (!result.success) {
        throw new Error(result.error || "Search failed");
      }

      return result.data;
    },
    ["game-search", query.toLowerCase(), String(offset)],
    {
      revalidate: 300, // 5 minutes
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

    // 1. Input validation (before rate limit to fail fast)
    const validation = SearchGamesSchema.safeParse({ query, offset });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid search parameters" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 2. Rate limit check (before cache to prevent abuse)
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: HTTP_STATUS.TOO_MANY_REQUESTS }
      );
    }

    logger.info(
      { query: validation.data.query, offset: validation.data.offset },
      "Game search request"
    );

    // 3. Fetch with cache
    const data = await getCachedIgdbSearch(
      validation.data.query,
      validation.data.offset
    )();

    return NextResponse.json(data, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.error({ error }, "Game search API error");
    return NextResponse.json(
      {
        error:
          "Game search is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
