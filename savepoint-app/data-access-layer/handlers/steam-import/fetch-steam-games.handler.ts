import { SteamService } from "@/data-access-layer/services/steam/steam-service";
import { ServiceErrorCode } from "@/data-access-layer/services/types";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import {
  DEFAULT_RATE_LIMIT_REQUESTS,
  RATE_LIMIT_RETRY_AFTER_SECONDS,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT, prisma } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

import type { HandlerResult, RequestContext } from "../types";
import type {
  FetchSteamGamesHandlerInput,
  FetchSteamGamesHandlerOutput,
} from "./types";

const logger = createLogger({
  [LOGGER_CONTEXT.HANDLER]: "FetchSteamGamesHandler",
});

export async function fetchSteamGamesHandler(
  input: FetchSteamGamesHandlerInput,
  context: RequestContext
): Promise<HandlerResult<FetchSteamGamesHandlerOutput>> {
  const { userId } = input;
  logger.info(
    { userId, ip: context.ip },
    "Processing Steam games fetch request"
  );

  const rateLimitResult = await checkRateLimit({
    headers: context.headers,
    ip: context.ip,
  });
  if (!rateLimitResult.allowed) {
    logger.warn({ userId, ip: context.ip }, "Rate limit exceeded");
    return {
      success: false,
      error: "Rate limit exceeded. Try again later.",
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
      headers: {
        "X-RateLimit-Limit": String(DEFAULT_RATE_LIMIT_REQUESTS),
        "X-RateLimit-Remaining": "0",
        "Retry-After": String(RATE_LIMIT_RETRY_AFTER_SECONDS),
      },
    };
  }

  let steamId64: string;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamId64: true },
    });

    if (!user?.steamId64) {
      logger.warn({ userId }, "User has no Steam account connected");
      return {
        success: false,
        error:
          "No Steam account connected. Please connect your Steam account first.",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    steamId64 = user.steamId64;
  } catch (error) {
    logger.error({ error, userId }, "Failed to fetch user Steam data");
    return {
      success: false,
      error: "Failed to fetch user data. Please try again.",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
  const steamService = new SteamService();

  const ownedGamesResult = await steamService.getOwnedGames({ steamId64 });

  if (!ownedGamesResult.success) {
    logger.error(
      {
        userId,
        steamId64,
        code: ownedGamesResult.code,
        error: ownedGamesResult.error,
      },
      "Failed to fetch owned games from Steam"
    );

    const statusMap: Partial<Record<ServiceErrorCode, number>> = {
      [ServiceErrorCode.UNAUTHORIZED]: HTTP_STATUS.FORBIDDEN,
      [ServiceErrorCode.STEAM_PROFILE_PRIVATE]: HTTP_STATUS.FORBIDDEN,
      [ServiceErrorCode.EXTERNAL_SERVICE_ERROR]:
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      [ServiceErrorCode.STEAM_API_UNAVAILABLE]: HTTP_STATUS.SERVICE_UNAVAILABLE,
      [ServiceErrorCode.RATE_LIMITED]: HTTP_STATUS.TOO_MANY_REQUESTS,
    };

    return {
      success: false,
      error: ownedGamesResult.error,
      status: ownedGamesResult.code
        ? (statusMap[ownedGamesResult.code] ??
          HTTP_STATUS.INTERNAL_SERVER_ERROR)
        : HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  const ownedGames = ownedGamesResult.data;
  const totalGames = ownedGames.length;

  logger.info({ userId, totalGames }, "Fetched owned games from Steam");

  let importedCount: number;
  try {
    importedCount = await prisma.$transaction(async (tx) => {
      let upsertedCount = 0;

      for (const game of ownedGames) {
        const existingGame = await tx.importedGame.findFirst({
          where: {
            userId,
            storefront: "STEAM",
            storefrontGameId: String(game.appId),
            deletedAt: null,
          },
        });

        if (existingGame) {
          await tx.importedGame.update({
            where: { id: existingGame.id },
            data: {
              name: game.name,
              playtime: game.playtimeForever,
              playtimeWindows: game.playtimeWindows,
              playtimeMac: game.playtimeMac,
              playtimeLinux: game.playtimeLinux,
              lastPlayedAt:
                game.rtimeLastPlayed && game.rtimeLastPlayed > 0
                  ? new Date(game.rtimeLastPlayed * 1000)
                  : null,
              img_icon_url: game.imgIconUrl,
              img_logo_url: game.imgLogoUrl,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.importedGame.create({
            data: {
              userId,
              name: game.name,
              storefront: "STEAM",
              storefrontGameId: String(game.appId),
              playtime: game.playtimeForever,
              playtimeWindows: game.playtimeWindows,
              playtimeMac: game.playtimeMac,
              playtimeLinux: game.playtimeLinux,
              lastPlayedAt:
                game.rtimeLastPlayed && game.rtimeLastPlayed > 0
                  ? new Date(game.rtimeLastPlayed * 1000)
                  : null,
              img_icon_url: game.imgIconUrl,
              img_logo_url: game.imgLogoUrl,
              igdbMatchStatus: "PENDING",
            },
          });
        }
        upsertedCount++;
      }

      return upsertedCount;
    });
  } catch (error) {
    logger.error({ error, userId }, "Failed to upsert imported games");
    return {
      success: false,
      error: "Failed to save imported games. Please try again.",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  logger.info(
    { userId, imported: importedCount, total: totalGames },
    "Successfully imported Steam games"
  );

  return {
    success: true,
    data: {
      imported: importedCount,
      total: totalGames,
      filtered: 0,
    },
    status: HTTP_STATUS.OK,
  };
}
