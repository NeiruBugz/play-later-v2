import { getServerUserId } from "@/auth";
import { SteamOpenIdService } from "@/data-access-layer/services/steam";
import { NextResponse, type NextRequest } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "steam-auth" });

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthorized Steam auth attempt");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const url = new URL(request.url);
    const callbackUrl = `${url.origin}/api/steam/auth/callback`;

    const steamOpenIdService = new SteamOpenIdService();
    const result = steamOpenIdService.getAuthUrl(callbackUrl);

    if (!result.success) {
      logger.error({ userId, error: result.error }, "Failed to generate Steam auth URL");
      return NextResponse.json(
        { error: result.error },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    logger.info({ userId, callbackUrl }, "Redirecting to Steam OpenID login");

    return NextResponse.redirect(result.data);
  } catch (error) {
    logger.error(
      { err: error, url: request.url },
      "Unexpected error in Steam auth API"
    );
    return NextResponse.json(
      {
        error:
          "Steam authentication service is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
