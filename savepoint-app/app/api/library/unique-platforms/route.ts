import { getUniquePlatformsHandler } from "@/data-access-layer/handlers/platform/get-unique-platforms";
import { NextResponse, type NextRequest } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.API_ROUTE]: "UniquePlatformsAPI",
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const url = new URL(request.url);
    logger.info({ ip }, "Unique platforms API request received");
    const result = await getUniquePlatformsHandler(request, {
      ip,
      headers: request.headers,
      url,
    });
    if (!result.success) {
      logger.warn(
        { error: result.error, status: result.status },
        "Unique platforms fetch failed"
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
      { platformsCount: result.data.platforms.length },
      "Unique platforms fetched successfully"
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
      "Unexpected error in unique platforms API"
    );
    return NextResponse.json(
      {
        success: false,
        error:
          "Platform service is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
