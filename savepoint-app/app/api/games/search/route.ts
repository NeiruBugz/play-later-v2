import { isSuccessResult } from "@/data-access-layer/services";
import { IgdbService } from "@/data-access-layer/services/igdb";
import { NextResponse, type NextRequest } from "next/server";

import { SearchGamesSchema } from "@/features/game-search/schemas";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "GameSearchAPI" });

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

    const { allowed } = checkRateLimit(request);
    if (!allowed) {
      logger.warn({ query }, "Rate limit exceeded");
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
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
    return NextResponse.json(result.data);
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
