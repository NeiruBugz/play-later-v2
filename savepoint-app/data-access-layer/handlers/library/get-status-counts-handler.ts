import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { GetStatusCountsSchema } from "@/data-access-layer/services/library/schemas";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import {
  DEFAULT_RATE_LIMIT_REQUESTS,
  RATE_LIMIT_RETRY_AFTER_SECONDS,
} from "@/shared/constants";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { checkRateLimit } from "@/shared/lib/rate-limit";

import { mapErrorToHandlerResult } from "../map-error";
import type { HandlerResult, RequestContext } from "../types";
import type {
  GetStatusCountsHandlerInput,
  GetStatusCountsHandlerOutput,
} from "./types";

const logger = createLogger({
  [LOGGER_CONTEXT.HANDLER]: "GetStatusCountsHandler",
});

export async function getStatusCountsHandler(
  input: GetStatusCountsHandlerInput,
  context: RequestContext
): Promise<HandlerResult<GetStatusCountsHandlerOutput>> {
  const { userId, platform, search } = input;
  logger.info(
    { userId, platform, search, ip: context.ip },
    "Processing status counts request"
  );

  const validation = GetStatusCountsSchema.safeParse(input);
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

  try {
    const libraryService = new LibraryService();
    const data = await libraryService.getStatusCounts(validation.data);

    logger.debug({ userId }, "Status counts fetched");
    return {
      success: true,
      data,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    return mapErrorToHandlerResult(error);
  }
}
