import { getServerUserId } from "@/auth";
import { getLibraryHandler } from "@/data-access-layer/handlers/library/get-library-handler";
import { NextResponse, type NextRequest } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "LibraryAPI" });
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthorized library access attempt");
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    const searchParams = request.nextUrl.searchParams;
    const rawStatus = searchParams.get("status");
    const rawPlatform = searchParams.get("platform");
    const rawSearch = searchParams.get("search");
    const rawSortBy = searchParams.get("sortBy");
    const rawSortOrder = searchParams.get("sortOrder");
    const rawOffset = searchParams.get("offset");
    const rawLimit = searchParams.get("limit");
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const url = new URL(request.url);
    logger.info(
      {
        userId,
        status: rawStatus,
        platform: rawPlatform,
        search: rawSearch,
        sortBy: rawSortBy,
        sortOrder: rawSortOrder,
        offset: rawOffset,
        limit: rawLimit,
        ip,
      },
      "Library API request received"
    );
    const result = await getLibraryHandler(
      {
        userId,
        status: rawStatus ?? undefined,
        platform: rawPlatform ?? undefined,
        search: rawSearch ?? undefined,
        sortBy:
          (rawSortBy as
            | "createdAt"
            | "releaseDate"
            | "startedAt"
            | "completedAt"
            | undefined) ?? undefined,
        sortOrder: (rawSortOrder as "asc" | "desc" | undefined) ?? undefined,
        offset: rawOffset ? parseInt(rawOffset, 10) : undefined,
        limit: rawLimit ? parseInt(rawLimit, 10) : undefined,
      },
      {
        ip,
        headers: request.headers,
        url,
      }
    );
    if (!result.success) {
      logger.warn(
        { userId, error: result.error, status: result.status },
        "Library fetch failed"
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
    logger.info(
      { userId, count: result.data.items.length, total: result.data.total },
      "Library items fetched successfully"
    );
    const response = NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: result.status }
    );
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    return response;
  } catch (error) {
    logger.error(
      { err: error, url: request.url },
      "Unexpected error in library API"
    );
    return NextResponse.json(
      {
        success: false,
        error:
          "Library service is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
