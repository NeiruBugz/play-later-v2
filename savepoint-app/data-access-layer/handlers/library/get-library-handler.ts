import { GetLibraryItemsBaseSchema } from "@/data-access-layer/services/library/schemas";
import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { z } from "zod";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import {
  DEFAULT_RATE_LIMIT_REQUESTS,
  RATE_LIMIT_RETRY_AFTER_SECONDS,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

import type { HandlerResult, RequestContext } from "../types";
import type { GetLibraryHandlerInput, GetLibraryHandlerOutput } from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "GetLibraryHandler" });

const GetLibrarySchema = GetLibraryItemsBaseSchema.extend({
  offset: z.number().int().min(0).max(10000).optional(),
});

export async function getLibraryHandler(
  input: GetLibraryHandlerInput,
  context: RequestContext
): Promise<HandlerResult<GetLibraryHandlerOutput>> {
  const { userId, status, platform, search, sortBy, sortOrder, offset, limit } =
    input;
  logger.info(
    {
      userId,
      status,
      platform,
      search,
      sortBy,
      sortOrder,
      offset,
      limit,
      ip: context.ip,
    },
    "Processing library fetch request"
  );

  const validation = GetLibrarySchema.safeParse(input);
  if (!validation.success) {
    logger.warn(
      { userId, errors: validation.error.issues },
      "Input validation failed"
    );
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid input parameters",
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

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

  const libraryService = new LibraryService();
  const isPaginated =
    validation.data.offset !== undefined || validation.data.limit !== undefined;
  const result = await libraryService.getLibraryItems({
    ...validation.data,
    distinctByGame: !isPaginated,
  });

  if (!result.success) {
    logger.error(
      { userId, error: result.error },
      "Service failed to fetch library items"
    );
    return {
      success: false,
      error: result.error,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  logger.debug(
    { userId, count: result.data.items.length, total: result.data.total },
    "Library items fetched"
  );
  return {
    success: true,
    data: result.data,
    status: HTTP_STATUS.OK,
  };
}
