import { getServerUserId } from "@/auth";
import {
  fetchSteamGamesHandler,
  importedGamesHandler,
} from "@/data-access-layer/handlers";
import { NextResponse } from "next/server";

import { importedGamesQuerySchema } from "@/features/steam-import/schemas";
import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "steam-games" });

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthorized Steam games fetch attempt");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    logger.info({ userId }, "Steam games fetch request received");

    const result = await fetchSteamGamesHandler(
      { userId },
      {
        ip: request.headers.get("x-forwarded-for") ?? "127.0.0.1",
        headers: request.headers,
        url: new URL(request.url),
      }
    );

    if (!result.success) {
      logger.warn(
        { userId, error: result.error, status: result.status },
        "Steam games fetch failed"
      );
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

    logger.info(
      { userId, imported: result.data.imported, total: result.data.total },
      "Steam games fetched successfully"
    );

    const response = NextResponse.json(
      {
        success: true,
        imported: result.data.imported,
        total: result.data.total,
        filtered: result.data.filtered,
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
      "Unexpected error in Steam games fetch API"
    );
    return NextResponse.json(
      {
        error:
          "Steam games fetch service is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthorized imported games list attempt");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(
      [...searchParams.entries()].map(([k, v]) => [k, v || undefined])
    );

    const parseResult = importedGamesQuerySchema.safeParse(queryParams);

    if (!parseResult.success) {
      logger.warn(
        { userId, errors: parseResult.error.flatten().fieldErrors },
        "Invalid query parameters for imported games list"
      );
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const {
      page,
      limit,
      search,
      playtimeStatus,
      playtimeRange,
      platform,
      lastPlayed,
      sortBy,
    } = parseResult.data;

    logger.info(
      {
        userId,
        page,
        limit,
        search,
        playtimeStatus,
        playtimeRange,
        platform,
        lastPlayed,
        sortBy,
      },
      "Imported games list request received"
    );

    const result = await importedGamesHandler({
      userId,
      page,
      limit,
      search,
      playtimeStatus,
      playtimeRange,
      platform,
      lastPlayed,
      sortBy,
    });

    if (!result.success) {
      logger.warn(
        { userId, error: result.error, status: result.status },
        "Imported games list failed"
      );
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    logger.info(
      {
        userId,
        total: result.data.pagination.total,
        page: result.data.pagination.page,
        totalPages: result.data.pagination.totalPages,
      },
      "Imported games listed successfully"
    );

    const response = NextResponse.json(
      {
        games: result.data.games,
        pagination: result.data.pagination,
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
      "Unexpected error in imported games list API"
    );
    return NextResponse.json(
      {
        error:
          "Imported games service is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
