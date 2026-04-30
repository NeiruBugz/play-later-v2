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
  const settingsUrl = `${url.origin}/settings/profile`;

  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthenticated user attempted Steam callback");
      return NextResponse.redirect(
        `${settingsUrl}?steam=error&reason=unauthorized`
      );
    }

    const steamOpenIdService = new SteamOpenIdService();
    let steamId64: string;
    try {
      steamId64 = await steamOpenIdService.validateCallback(url.searchParams);
    } catch (error) {
      logger.warn({ userId, error }, "Steam OpenID validation failed");
      return NextResponse.redirect(
        `${settingsUrl}?steam=error&reason=validation`
      );
    }

    const steamService = new SteamService();
    let profile: Awaited<ReturnType<SteamService["getPlayerSummary"]>>;
    try {
      profile = await steamService.getPlayerSummary({ steamId64 });
    } catch (error) {
      logger.warn(
        { userId, steamId64, error },
        "Failed to fetch Steam profile"
      );
      return NextResponse.redirect(`${settingsUrl}?steam=error&reason=profile`);
    }

    try {
      await steamService.connectSteamAccount({ userId, profile });
    } catch (error) {
      logger.error(
        { userId, steamId64, error },
        "Failed to save Steam connection"
      );
      return NextResponse.redirect(`${settingsUrl}?steam=error&reason=server`);
    }

    logger.info({ userId, steamId64 }, "Steam account connected via OpenID");

    return NextResponse.redirect(`${settingsUrl}?steam=connected`);
  } catch (error) {
    logger.error(
      { err: error, url: request.url },
      "Unexpected error in Steam callback"
    );
    return NextResponse.redirect(`${settingsUrl}?steam=error&reason=server`);
  }
}
