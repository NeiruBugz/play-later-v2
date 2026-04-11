import { igdbSearchHandler } from "@/data-access-layer/handlers";
import { NextResponse, type NextRequest } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "game-search" });

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") ?? "";
    const parsedOffset = parseInt(searchParams.get("offset") ?? "0", 10);
    const offset =
      Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

    const result = await igdbSearchHandler.search(
      { query, offset },
      {
        ip: request.headers.get("x-forwarded-for") ?? "127.0.0.1",
        headers: request.headers,
        url: new URL(request.url),
      }
    );

    if (!result.success) {
      const response = NextResponse.json(
        { error: result.error },
        { status: result.status }
      );

      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          response.headers.set(key, String(value));
        });
      }

      return response;
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    logger.error({ err: error, url: request.url }, "Game search API error");
    return NextResponse.json(
      {
        error:
          "Game search is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
