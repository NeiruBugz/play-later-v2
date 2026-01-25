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

  const UPDATE_BATCH_SIZE = 100;

  let importedCount: number;
  try {
    // 1. Single query - get all existing games for this user/storefront
    const existingGames = await prisma.importedGame.findMany({
      where: {
        userId,
        storefront: "STEAM",
        deletedAt: null,
      },
      select: { id: true, storefrontGameId: true },
    });
    const existingMap = new Map(
      existingGames.map((g) => [g.storefrontGameId, g.id])
    );

    // 2. Separate into creates and updates
    const toCreate: typeof ownedGames = [];
    const toUpdate: Array<{ id: string; game: (typeof ownedGames)[number] }> =
      [];

    for (const game of ownedGames) {
      const existingId = existingMap.get(String(game.appId));
      if (existingId) {
        toUpdate.push({ id: existingId, game });
      } else {
        toCreate.push(game);
      }
    }

    logger.info(
      { userId, toCreate: toCreate.length, toUpdate: toUpdate.length },
      "Separated games into creates and updates"
    );

    // 3. Bulk create new games (single query)
    if (toCreate.length > 0) {
      await prisma.importedGame.createMany({
        data: toCreate.map((game) => ({
          userId,
          name: game.name,
          storefront: "STEAM" as const,
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
          igdbMatchStatus: "PENDING" as const,
        })),
      });
      logger.info({ userId, count: toCreate.length }, "Created new games");
    }

    // 4. Batch updates with extended timeout
    for (let i = 0; i < toUpdate.length; i += UPDATE_BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + UPDATE_BATCH_SIZE);
      const now = new Date();

      await prisma.$transaction(
        async (tx) => {
          await Promise.all(
            batch.map(({ id, game }) =>
              tx.importedGame.update({
                where: { id },
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
                  updatedAt: now,
                },
              })
            )
          );
        },
        { timeout: 30000 }
      );

      logger.debug(
        { userId, batchIndex: i / UPDATE_BATCH_SIZE, batchSize: batch.length },
        "Updated batch of games"
      );
    }

    importedCount = toCreate.length + toUpdate.length;
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
