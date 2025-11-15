import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import type { HandlerResult, RequestContext } from "../types";
import type { GetLibraryHandlerInput, GetLibraryHandlerOutput } from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "GetLibraryHandler" });

/**
 * Zod schema for GET /api/library query parameters
 */
const GetLibrarySchema = z.object({
  userId: z.string().cuid(),
  status: z.nativeEnum(LibraryItemStatus).optional(),
  platform: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "releaseDate", "startedAt", "completedAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * Get library handler
 *
 * Orchestrates library fetch requests by:
 * 1. Validating input parameters
 * 2. Calling LibraryService to fetch filtered items
 * 3. Formatting response
 *
 * @param input - Query parameters (userId, status, platform, search, sortBy, sortOrder)
 * @param context - Request context (IP, headers, URL)
 * @returns Handler result with library items or error
 */
export async function getLibraryHandler(
  input: GetLibraryHandlerInput,
  context: RequestContext
): Promise<HandlerResult<GetLibraryHandlerOutput>> {
  const { userId, status, platform, search, sortBy, sortOrder } = input;

  logger.info(
    { userId, status, platform, search, sortBy, sortOrder, ip: context.ip },
    "Processing library fetch request"
  );

  // 1. Validate input
  const validation = GetLibrarySchema.safeParse(input);
  if (!validation.success) {
    logger.warn(
      { userId, errors: validation.error.errors },
      "Input validation failed"
    );
    return {
      success: false,
      error: validation.error.errors[0]?.message ?? "Invalid input parameters",
      status: 400,
    };
  }

  // 2. Call service
  const libraryService = new LibraryService();
  const result = await libraryService.getLibraryItems({
    ...validation.data,
    distinctByGame: true, // Library view shows one item per game
  });

  // 3. Handle service result
  if (!result.success) {
    logger.error(
      { userId, error: result.error },
      "Service failed to fetch library items"
    );
    return {
      success: false,
      error: result.error,
      status: 500,
    };
  }

  // 4. Return success
  logger.info(
    { userId, count: result.data.length },
    "Library items fetched successfully"
  );

  return {
    success: true,
    data: result.data,
    status: 200,
  };
}
