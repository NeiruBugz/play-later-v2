import { getServerUserId } from "@/auth";
import { connectSteamHandler } from "@/data-access-layer/handlers/steam-import";
import { NextResponse, type NextRequest } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "steam-connect" });

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Check authentication
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthorized Steam connect attempt");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      logger.warn({ userId }, "Invalid JSON in Steam connect request");
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const steamId =
      typeof body === "object" && body !== null && "steamId" in body
        ? (body as { steamId: unknown }).steamId
        : undefined;

    if (typeof steamId !== "string") {
      logger.warn({ userId }, "Missing or invalid steamId");
      return NextResponse.json(
        { error: "steamId is required and must be a string" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    logger.info({ userId, steamId }, "Steam connect request received");

    // 3. Call handler
    const result = await connectSteamHandler(
      { steamId, userId },
      {
        ip: request.headers.get("x-forwarded-for") ?? "127.0.0.1",
        headers: request.headers,
        url: new URL(request.url),
      }
    );

    // 4. Return response based on result
    if (!result.success) {
      logger.warn(
        { userId, steamId, error: result.error, status: result.status },
        "Steam connect failed"
      );
      const response = NextResponse.json(
        { error: result.error },
        { status: result.status }
      );

      // Forward rate limit headers if present
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          response.headers.set(key, String(value));
        });
      }

      return response;
    }

    logger.info(
      { userId, steamId: result.data.profile.steamId64 },
      "Steam connected successfully"
    );

    const response = NextResponse.json(
      {
        success: true,
        profile: result.data.profile,
      },
      { status: result.status }
    );

    // Set security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");

    return response;
  } catch (error) {
    logger.error(
      { err: error, url: request.url },
      "Unexpected error in Steam connect API"
    );
    return NextResponse.json(
      {
        error:
          "Steam connection service is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
