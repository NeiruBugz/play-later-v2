import { z } from "zod";

import { getActivityForUser } from "@/entities/activity-feed/api";
import {
  FeedCursorSchema,
  type ActivityFeedResult,
} from "@/entities/activity-feed/model";

/**
 * Worker for `getActivityForUserFn` — per-user activity stream used by the
 * profile-activity tab on `/u/$username`.
 *
 * Anonymous-allowed: the wrapper resolves the (possibly `undefined`) viewer
 * server-side and threads it here. The privacy gate lives on the entity query
 * (`getActivityForUser`), which only returns a PRIVATE profile's activity to
 * its owner — anonymous and other-user viewers see public profiles only.
 */
export const GET_ACTIVITY_FOR_USER_INPUT = z.object({
  targetUserId: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
  cursor: FeedCursorSchema.optional(),
});

export async function getActivityForUserWorker(
  viewerUserId: string | undefined,
  data: unknown
): Promise<ActivityFeedResult> {
  const { targetUserId, limit, cursor } =
    GET_ACTIVITY_FOR_USER_INPUT.parse(data);
  return getActivityForUser(targetUserId, viewerUserId, { limit, cursor });
}
