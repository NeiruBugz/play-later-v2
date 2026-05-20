import { createServerFn } from "@tanstack/react-start";

import type { ActivityFeedResult } from "@/entities/activity-feed/model";
import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  GET_ACTIVITY_FEED_INPUT,
  getActivityFeedWorker,
} from "./get-activity-feed.worker";

/**
 * Server-fn wrapper for the social activity feed read.
 *
 * Auth-gated: anonymous viewers receive `UnauthorizedError`.
 */
export const getActivityFeedFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => GET_ACTIVITY_FEED_INPUT.parse(data))
  .handler(async ({ data }): Promise<ActivityFeedResult> => {
    const userId = await requireUserId();
    return getActivityFeedWorker(userId, data);
  });
