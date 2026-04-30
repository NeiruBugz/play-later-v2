import { SteamProfilePrivateError } from "@/data-access-layer/services/steam/errors";
import { SteamService } from "@/data-access-layer/services/steam/steam-service";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import {
  DEFAULT_RATE_LIMIT_REQUESTS,
  RATE_LIMIT_RETRY_AFTER_SECONDS,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT, prisma } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

import { mapErrorToHandlerResult } from "../map-error";
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

  let ownedGames: Awaited<ReturnType<SteamService["getOwnedGames"]>>;
  try {
    ownedGames = await steamService.getOwnedGames({ steamId64 });
  } catch (error) {
    logger.error(
      { error, userId, steamId64 },
      "Failed to fetch owned games from Steam"
    );

    if (error instanceof SteamProfilePrivateError) {
      return {
        success: false,
        error: error.message,
        status: HTTP_STATUS.FORBIDDEN,
      };
    }

    return mapErrorToHandlerResult(error);
  }

  const totalGames = ownedGames.length;

  logger.info({ userId, totalGames }, "Fetched owned games from Steam");

  const UPDATE_BATCH_SIZE = 100;

  let importedCount: number;
  try {
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
