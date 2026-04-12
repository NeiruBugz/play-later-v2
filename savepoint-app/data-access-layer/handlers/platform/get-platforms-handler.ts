import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import type { HandlerResult, RequestContext } from "../types";
import { getPlatformsForLibraryModal } from "./get-platforms-for-library-modal";
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

const PLATFORMS_REVALIDATE_SECONDS = 86400;

async function getCachedGamePlatforms(
  igdbId: number
): Promise<GetPlatformsHandlerOutput> {
  "use cache";
  cacheLife({ revalidate: PLATFORMS_REVALIDATE_SECONDS });
  cacheTag("platforms:game", `platforms:game:${igdbId}`);

  logger.info({ igdbId }, "Game platforms cache miss - fetching from use-case");

  const result = await getPlatformsForLibraryModal({ igdbId });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

export async function getPlatformsHandler(
  input: GetPlatformsHandlerInput,
  context: RequestContext
): Promise<HandlerResult<GetPlatformsHandlerOutput>> {
  const { igdbId } = input;
  logger.info({ igdbId, ip: context.ip }, "Processing platforms fetch request");

  const validation = GetPlatformsSchema.safeParse(input);
  if (!validation.success) {
    logger.warn(
      { igdbId, errors: validation.error.issues },
      "Input validation failed"
    );
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid IGDB ID",
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

  try {
    const data = await getCachedGamePlatforms(validation.data.igdbId);

    logger.info(
      {
        igdbId,
        supportedCount: data.supportedPlatforms.length,
        otherCount: data.otherPlatforms.length,
      },
      "Platforms fetched successfully"
    );
    return {
      success: true,
      data,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch platforms for game";

    logger.error({ igdbId, error }, "Use-case failed to fetch platforms");

    return {
      success: false,
      error: message,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
}
