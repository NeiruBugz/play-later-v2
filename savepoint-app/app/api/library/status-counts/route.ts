import { getServerUserId } from "@/auth";
import { getStatusCountsHandler } from "@/data-access-layer/handlers/library/get-status-counts-handler";
import { NextResponse, type NextRequest } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.API_ROUTE]: "LibraryStatusCountsAPI",
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthorized status counts access attempt");
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const url = new URL(request.url);

    logger.info(
      { userId, platform, search, ip },
      "Status counts request received"
    );

    const result = await getStatusCountsHandler(
      { userId, platform, search },
      { ip, headers: request.headers, url }
    );

    if (!result.success) {
      logger.warn(
        { userId, error: result.error, status: result.status },
        "Status counts fetch failed"
      );
      const response = NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          response.headers.set(key, String(value));
        });
      }
      return response;
    }

    logger.info({ userId }, "Status counts fetched successfully");
    const response = NextResponse.json(
      { success: true, data: result.data },
      { status: result.status }
    );
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  } catch (error) {
    logger.error(
      { err: error, url: request.url },
      "Unexpected error in status counts API"
    );
    return NextResponse.json(
      {
        success: false,
        error:
          "Status counts service is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
