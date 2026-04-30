import { ActivityFeedService } from "@/data-access-layer/services";
import { z } from "zod";

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
  ActivityFeedHandlerInput,
  ActivityFeedHandlerOutput,
} from "./types";

const logger = createLogger({
  [LOGGER_CONTEXT.HANDLER]: "ActivityFeedHandler",
});

const MAX_FEED_LIMIT = 50;
const DEFAULT_FEED_LIMIT = 20;

const FeedCursorSchema = z.object({
  timestamp: z.string().datetime(),
  id: z.string().min(1),
});

const FeedQuerySchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_FEED_LIMIT)
    .optional()
    .default(DEFAULT_FEED_LIMIT),
  cursor: FeedCursorSchema.optional(),
});

function parseCursorParam(raw?: string) {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function activityFeedHandler(
  input: ActivityFeedHandlerInput,
  context: RequestContext
): Promise<HandlerResult<ActivityFeedHandlerOutput>> {
  const { userId } = input;

  logger.info({ userId, ip: context.ip }, "Processing activity feed request");

  const rawCursor = parseCursorParam(input.cursor);
  if (rawCursor === null) {
    return {
      success: false,
      error: "Invalid cursor format. Expected JSON: { timestamp, id }",
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

  const rawLimit = input.limit ? parseInt(input.limit, 10) : undefined;
  const limitValue = Number.isFinite(rawLimit) ? rawLimit : undefined;

  const validation = FeedQuerySchema.safeParse({
    limit: limitValue,
    cursor: rawCursor,
  });

  if (!validation.success) {
    logger.warn(
      { userId, errors: validation.error.issues },
      "Feed input validation failed"
    );
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid query parameters",
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
    const service = new ActivityFeedService();
    const data = await service.getFeedForUser(
      userId,
      validation.data.cursor,
      validation.data.limit
    );

    logger.debug(
      {
        userId,
        itemCount: data.items.length,
        hasMore: data.nextCursor !== null,
      },
      "Activity feed fetched"
    );

    return {
      success: true,
      data: {
        items: data.items,
        nextCursor: data.nextCursor,
      },
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    return mapErrorToHandlerResult(error);
  }
}
