import { getPlatformsHandler } from "@/data-access-layer/handlers/platform/get-platforms-handler";
import { NextResponse, type NextRequest } from "next/server";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.API_ROUTE]: "GamePlatformsAPI",
});

/**
 * GET /api/games/[igdbId]/platforms - Fetch platforms for a specific game
 *
 * Returns platforms grouped into:
 * - supportedPlatforms: Platforms officially supported by the game (from IGDB)
 * - otherPlatforms: All other platforms in the database
 *
 * Route parameters:
 * - igdbId: The IGDB ID of the game (integer)
 *
 * Authentication: Not required (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ igdbId: string }> }
): Promise<NextResponse> {
  try {
    const { igdbId: igdbIdStr } = await params;

    // Parse and validate igdbId
    const igdbId = parseInt(igdbIdStr, 10);

    if (isNaN(igdbId) || igdbId <= 0) {
      logger.warn(
        { igdbIdStr, ip: request.headers.get("x-forwarded-for") },
        "Invalid IGDB ID format"
      );
      return NextResponse.json(
        { success: false, error: "Invalid IGDB ID" },
        { status: 400 }
      );
    }

    // Extract request context
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const url = new URL(request.url);

    logger.info(
      {
        igdbId,
        ip,
      },
      "Game platforms API request received"
    );

    // Call handler with full context
    const result = await getPlatformsHandler(
      { igdbId },
      {
        ip,
        headers: request.headers,
        url,
      }
    );

    // Transform handler result to NextResponse
    if (!result.success) {
      logger.warn(
        { igdbId, error: result.error, status: result.status },
        "Platforms fetch failed"
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
      {
        igdbId,
        supportedCount: result.data.supportedPlatforms.length,
        otherCount: result.data.otherPlatforms.length,
      },
      "Platforms fetched successfully"
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
      "Unexpected error in game platforms API"
    );
    return NextResponse.json(
      {
        success: false,
        error:
          "Platform service is temporarily unavailable. Please try again later.",
      },
      { status: 500 }
    );
  }
}
