import { getServerUserId } from "@/auth";
import { activityFeedHandler } from "@/data-access-layer/handlers";
import { NextResponse, type NextRequest } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "SocialFeedAPI" });

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthorized feed access attempt");
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = searchParams.get("limit") ?? undefined;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const url = new URL(request.url);

    logger.info({ userId, cursor, limit, ip }, "Feed API request received");

    const result = await activityFeedHandler(
      { userId, cursor, limit },
      { ip, headers: request.headers, url }
    );

    if (!result.success) {
      logger.warn(
        { userId, error: result.error, status: result.status },
        "Feed fetch failed"
      );
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: result.status }
    );
  } catch (error) {
    logger.error(
      { err: error, url: request.url },
      "Unexpected error in feed API"
    );
    return NextResponse.json(
      {
        success: false,
        error:
          "Activity feed is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
