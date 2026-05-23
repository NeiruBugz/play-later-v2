import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import type { ActivityFeedResult } from "@/entities/activity-feed/model";
import { getServerUserId } from "@/entities/session/api/get-session.server";

import {
  GET_ACTIVITY_FOR_USER_INPUT,
  getActivityForUserWorker,
} from "./get-activity-for-user.worker";

/**
 * Server-fn wrapper for the per-user activity read.
 *
 * Anonymous-allowed (public profiles are viewable signed-out), so the viewer
 * is resolved with `getServerUserId(getRequest())` — NOT `requireUserId()`.
 * The resolved (possibly `undefined`) viewer is threaded into the worker so
 * the entity-layer privacy gate can enforce owner-only access to PRIVATE
 * profiles' activity. The viewer is never trusted from input.
 */
export const getActivityForUserFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => GET_ACTIVITY_FOR_USER_INPUT.parse(data))
  .handler(async ({ data }): Promise<ActivityFeedResult> => {
    const viewerUserId = await getServerUserId(getRequest());
    return getActivityForUserWorker(viewerUserId ?? undefined, data);
  });
