import { SteamProfilePrivateError } from "@/data-access-layer/services/steam/errors";
import { SteamService } from "@/data-access-layer/services/steam/steam-service";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import {
  DEFAULT_RATE_LIMIT_REQUESTS,
  RATE_LIMIT_RETRY_AFTER_SECONDS,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

import { mapErrorToHandlerResult } from "../map-error";
import type { HandlerResult, RequestContext } from "../types";
import { connectSteamSchema } from "./schemas";
import type {
  ConnectSteamHandlerInput,
  ConnectSteamHandlerOutput,
} from "./types";

const logger = createLogger({
  [LOGGER_CONTEXT.HANDLER]: "ConnectSteamHandler",
});

export async function connectSteamHandler(
  input: ConnectSteamHandlerInput,
  context: RequestContext
): Promise<HandlerResult<ConnectSteamHandlerOutput>> {
  const { steamId, userId } = input;
  logger.info(
    { steamId, userId, ip: context.ip },
    "Processing Steam connect request"
  );

  const validation = connectSteamSchema.safeParse({ steamId });
  if (!validation.success) {
    logger.warn(
      { steamId, errors: validation.error.issues },
      "Input validation failed"
    );
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid Steam ID format",
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

  const rateLimitResult = await checkRateLimit({
    headers: context.headers,
    ip: context.ip,
  });
  if (!rateLimitResult.allowed) {
    logger.warn({ steamId, userId, ip: context.ip }, "Rate limit exceeded");
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

  const steamService = new SteamService();

  let steamId64: string;
  try {
    steamId64 = await steamService.validateSteamId({
      input: validation.data.steamId,
    });
  } catch (error) {
    logger.warn({ steamId, error }, "Steam ID validation failed");
    return {
      success: false,
      error: "Invalid Steam ID or Steam profile not found",
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

  let profile: Awaited<ReturnType<SteamService["getPlayerSummary"]>>;
  try {
    profile = await steamService.getPlayerSummary({ steamId64 });
  } catch (error) {
    logger.error({ steamId64, error }, "Failed to fetch Steam profile");

    if (error instanceof SteamProfilePrivateError) {
      return {
        success: false,
        error: error.message,
        status: HTTP_STATUS.FORBIDDEN,
      };
    }

    return mapErrorToHandlerResult(error);
  }

  try {
    await steamService.connectSteamAccount({ userId, profile });
  } catch (error) {
    logger.error(
      { userId, steamId64, error },
      "Failed to update user with Steam data"
    );
    return {
      success: false,
      error: "Failed to connect Steam account. Please try again.",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  logger.info(
    {
      userId,
      steamId64: profile.steamId64,
      displayName: profile.displayName,
    },
    "Steam account connected successfully"
  );

  return {
    success: true,
    data: {
      profile: {
        steamId64: profile.steamId64,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        profileUrl: profile.profileUrl,
        isPublic: profile.isPublic,
      },
    },
    status: HTTP_STATUS.OK,
  };
}
