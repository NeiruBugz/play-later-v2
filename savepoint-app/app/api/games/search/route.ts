import { gameSearchHandler } from "@/data-access-layer/handlers";
import { NextResponse, type NextRequest } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "GameSearchAPI" });

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") ?? "";
    const parsedOffset = parseInt(searchParams.get("offset") ?? "0", 10);
    const offset =
      Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const headers = request.headers;
    logger.info({ query, offset, ip }, "Game search API request received");
    const result = await gameSearchHandler(
      { query, offset },
      { ip, headers, url: request.nextUrl }
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
    const response = NextResponse.json(result.data, { status: result.status });
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
