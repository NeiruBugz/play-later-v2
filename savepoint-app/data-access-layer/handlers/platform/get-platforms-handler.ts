import { PlatformService } from "@/data-access-layer/services/platform/platform-service";
import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import type { HandlerResult, RequestContext } from "../types";
import type {
  GetPlatformsHandlerInput,
  GetPlatformsHandlerOutput,
} from "./types";

const logger = createLogger({
  [LOGGER_CONTEXT.HANDLER]: "GetPlatformsHandler",
});

/**
 * Zod schema for GET /api/games/[igdbId]/platforms route parameters
 */
const GetPlatformsSchema = z.object({
  igdbId: z.number().int().positive("IGDB ID must be a positive integer"),
});

/**
 * Get platforms handler
 *
 * Orchestrates platform fetch requests by:
 * 1. Validating input parameters (igdbId)
 * 2. Calling PlatformService to fetch platforms
 * 3. Formatting response with supported and other platforms
 *
 * @param input - Route parameters (igdbId)
 * @param context - Request context (IP, headers, URL)
 * @returns Handler result with platforms or error
 */
export async function getPlatformsHandler(
  input: GetPlatformsHandlerInput,
  context: RequestContext
): Promise<HandlerResult<GetPlatformsHandlerOutput>> {
  const { igdbId } = input;

  logger.info({ igdbId, ip: context.ip }, "Processing platforms fetch request");

  // 1. Validate input
  const validation = GetPlatformsSchema.safeParse(input);
  if (!validation.success) {
    logger.warn(
      { igdbId, errors: validation.error.errors },
      "Input validation failed"
    );
    return {
      success: false,
      error: validation.error.errors[0]?.message ?? "Invalid IGDB ID",
      status: 400,
    };
  }

  // 2. Call service
  const platformService = new PlatformService();
  const result = await platformService.getPlatformsForGame(
    validation.data.igdbId
  );

  // 3. Handle service result
  if (!result.success) {
    // Return 404 if game not found, 500 for other errors
    const status = result.error === "Game not found" ? 404 : 500;

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

  // 4. Return success
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
    status: 200,
  };
}
