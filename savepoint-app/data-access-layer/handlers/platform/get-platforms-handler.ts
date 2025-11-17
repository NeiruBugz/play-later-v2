import { PlatformService } from "@/data-access-layer/services/platform/platform-service";
import { z } from "zod";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import type { HandlerResult, RequestContext } from "../types";
import type {
  GetPlatformsHandlerInput,
  GetPlatformsHandlerOutput,
} from "./types";

const logger = createLogger({
  [LOGGER_CONTEXT.HANDLER]: "GetPlatformsHandler",
});

const GetPlatformsSchema = z.object({
  igdbId: z.number().int().positive("IGDB ID must be a positive integer"),
});

export async function getPlatformsHandler(
  input: GetPlatformsHandlerInput,
  context: RequestContext
): Promise<HandlerResult<GetPlatformsHandlerOutput>> {
  const { igdbId } = input;
  logger.info({ igdbId, ip: context.ip }, "Processing platforms fetch request");

  const validation = GetPlatformsSchema.safeParse(input);
  if (!validation.success) {
    logger.warn(
      { igdbId, errors: validation.error.errors },
      "Input validation failed"
    );
    return {
      success: false,
      error: validation.error.errors[0]?.message ?? "Invalid IGDB ID",
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

  const platformService = new PlatformService();
  const result = await platformService.getPlatformsForGame(
    validation.data.igdbId
  );

  if (!result.success) {
    const status =
      result.error === "Game not found"
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    logger.error(
      { igdbId, error: result.error, status },
      "Service failed to fetch platforms"
    );
    return {
      success: false,
      error: result.error,
      status,
    };
  }

  logger.info(
    {
      igdbId,
      supportedCount: result.data.supportedPlatforms.length,
      otherCount: result.data.otherPlatforms.length,
    },
    "Platforms fetched successfully"
  );
  return {
    success: true,
    data: result.data,
    status: HTTP_STATUS.OK,
  };
}
