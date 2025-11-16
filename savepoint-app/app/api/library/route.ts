import { getServerUserId } from "@/auth";
import { getLibraryHandler } from "@/data-access-layer/handlers/library/get-library-handler";
import { NextResponse, type NextRequest } from "next/server";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "LibraryAPI" });

/**
 * GET /api/library - Fetch authenticated user's library items
 *
 * Query parameters:
 * - status: Filter by library item status (optional)
 * - platform: Filter by platform name (optional)
 * - search: Search game titles (optional, case-insensitive)
 * - sortBy: Sort field - createdAt | releaseDate | startedAt | completedAt (optional)
 * - sortOrder: Sort order - asc | desc (optional)
 *
 * Authentication: Required
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication check
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthorized library access attempt");
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawStatus = searchParams.get("status");
    const rawPlatform = searchParams.get("platform");
    const rawSearch = searchParams.get("search");
    const rawSortBy = searchParams.get("sortBy");
    const rawSortOrder = searchParams.get("sortOrder");

    // Extract request context
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
        ip,
      },
      "Library API request received"
    );

    // 3. Call handler with full context
    // Handler validates types with Zod schema
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
      },
      {
        ip,
        headers: request.headers,
        url,
      }
    );

    // 4. Transform handler result to NextResponse
    if (!result.success) {
      logger.warn(
        { userId, error: result.error, status: result.status },
        "Library fetch failed"
      );

      const response = NextResponse.json(
        { success: false, error: result.error },
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

    logger.info(
      { userId, count: result.data.length },
      "Library items fetched successfully"
    );

    const response = NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: result.status }
    );

    // Add security headers
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
      { status: 500 }
    );
  }
}
