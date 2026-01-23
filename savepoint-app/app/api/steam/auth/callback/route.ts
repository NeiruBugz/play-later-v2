import { getServerUserId } from "@/auth";
import {
  SteamOpenIdService,
  SteamService,
} from "@/data-access-layer/services/steam";
import { NextResponse, type NextRequest } from "next/server";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.API_ROUTE]: "steam-auth-callback",
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const settingsUrl = `${url.origin}/profile/settings`;

  try {
    // 1. Check authentication
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthenticated user attempted Steam callback");
      return NextResponse.redirect(
        `${settingsUrl}?steam=error&reason=unauthorized`
      );
    }

    // 2. Validate OpenID callback
    const steamOpenIdService = new SteamOpenIdService();
    const validateResult = await steamOpenIdService.validateCallback(
      url.searchParams
    );

    if (!validateResult.success) {
      logger.warn(
        { userId, error: validateResult.error },
        "Steam OpenID validation failed"
      );
      return NextResponse.redirect(
        `${settingsUrl}?steam=error&reason=validation`
      );
    }

    const steamId64 = validateResult.data;

    // 3. Fetch Steam profile
    const steamService = new SteamService();
    const profileResult = await steamService.getPlayerSummary({ steamId64 });

    if (!profileResult.success) {
      logger.warn(
        { userId, steamId64, error: profileResult.error },
        "Failed to fetch Steam profile"
      );
      return NextResponse.redirect(`${settingsUrl}?steam=error&reason=profile`);
    }

    const profile = profileResult.data;

    // 4. Update User record via service
    const connectResult = await steamService.connectSteamAccount({
      userId,
      profile,
    });

    if (!connectResult.success) {
      logger.error(
        { userId, steamId64, error: connectResult.error },
        "Failed to save Steam connection"
      );
      return NextResponse.redirect(`${settingsUrl}?steam=error&reason=server`);
    }

    logger.info({ userId, steamId64 }, "Steam account connected via OpenID");

    // 5. Redirect to settings with success
    return NextResponse.redirect(`${settingsUrl}?steam=connected`);
  } catch (error) {
    logger.error(
      { err: error, url: request.url },
      "Unexpected error in Steam callback"
    );
    return NextResponse.redirect(`${settingsUrl}?steam=error&reason=server`);
  }
}
