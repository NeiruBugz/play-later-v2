import { SteamService } from "@/data-access-layer/services/steam/steam-service";
import { ServiceErrorCode } from "@/data-access-layer/services/types";

import { connectSteamSchema } from "@/features/steam-import/schemas";
import { HTTP_STATUS } from "@/shared/config/http-codes";
import {
  DEFAULT_RATE_LIMIT_REQUESTS,
  RATE_LIMIT_RETRY_AFTER_SECONDS,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT, prisma } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

import type { HandlerResult, RequestContext } from "../types";
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

  const validateResult = await steamService.validateSteamId({
    input: validation.data.steamId,
  });

  if (!validateResult.success) {
    logger.warn(
      { steamId, code: validateResult.code, error: validateResult.error },
      "Steam ID validation failed"
    );

    const statusMap: Partial<Record<ServiceErrorCode, number>> = {
      [ServiceErrorCode.VALIDATION_ERROR]: HTTP_STATUS.BAD_REQUEST,
      [ServiceErrorCode.NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
      [ServiceErrorCode.UNAUTHORIZED]: HTTP_STATUS.FORBIDDEN,
      [ServiceErrorCode.EXTERNAL_SERVICE_ERROR]:
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      [ServiceErrorCode.STEAM_API_UNAVAILABLE]: HTTP_STATUS.SERVICE_UNAVAILABLE,
      [ServiceErrorCode.RATE_LIMITED]: HTTP_STATUS.TOO_MANY_REQUESTS,
    };

    return {
      success: false,
      error: validateResult.error,
      status: validateResult.code
        ? (statusMap[validateResult.code] ?? HTTP_STATUS.INTERNAL_SERVER_ERROR)
        : HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  const steamId64 = validateResult.data;

  const profileResult = await steamService.getPlayerSummary({ steamId64 });

  if (!profileResult.success) {
    logger.error(
      { steamId64, code: profileResult.code, error: profileResult.error },
      "Failed to fetch Steam profile"
    );

    const statusMap: Partial<Record<ServiceErrorCode, number>> = {
      [ServiceErrorCode.NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
      [ServiceErrorCode.UNAUTHORIZED]: HTTP_STATUS.FORBIDDEN,
      [ServiceErrorCode.STEAM_PROFILE_PRIVATE]: HTTP_STATUS.FORBIDDEN,
      [ServiceErrorCode.EXTERNAL_SERVICE_ERROR]:
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      [ServiceErrorCode.STEAM_API_UNAVAILABLE]: HTTP_STATUS.SERVICE_UNAVAILABLE,
      [ServiceErrorCode.RATE_LIMITED]: HTTP_STATUS.TOO_MANY_REQUESTS,
    };

    return {
      success: false,
      error: profileResult.error,
      status: profileResult.code
        ? (statusMap[profileResult.code] ?? HTTP_STATUS.INTERNAL_SERVER_ERROR)
        : HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  const profile = profileResult.data;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        steamId64: profile.steamId64,
        steamUsername: profile.displayName,
        steamAvatar: profile.avatarUrl,
        steamProfileURL: profile.profileUrl,
        steamConnectedAt: new Date(),
      },
    });

    logger.info(
      {
        userId,
        steamId64: profile.steamId64,
        displayName: profile.displayName,
      },
      "Steam account connected successfully"
    );
  } catch (error) {
    logger.error(
      { error, userId, steamId64 },
      "Failed to update user with Steam data"
    );
    return {
      success: false,
      error: "Failed to connect Steam account. Please try again.",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  return {
    success: true,
    data: {
      profile: {
        steamId64: profile.steamId64,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        profileUrl: profile.profileUrl,
      },
    },
    status: HTTP_STATUS.OK,
  };
}
