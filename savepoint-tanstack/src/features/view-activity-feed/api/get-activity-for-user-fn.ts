import { createServerFn } from "@tanstack/react-start";

import type { ActivityFeedResult } from "@/entities/activity-feed/model";

import {
  GET_ACTIVITY_FOR_USER_INPUT,
  getActivityForUserWorker,
} from "./get-activity-for-user.worker";

/**
 * Server-fn wrapper for the per-user activity read.
 *
 * Anonymous-allowed: callers need only the target user id; the entity layer
 * (`getActivityForUser`) is privacy-agnostic and the route layer gates on
 * `getPublicProfile` before exposing this surface.
 */
export const getActivityForUserFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => GET_ACTIVITY_FOR_USER_INPUT.parse(data))
  .handler(async ({ data }): Promise<ActivityFeedResult> => {
    return getActivityForUserWorker(undefined, data);
  });
