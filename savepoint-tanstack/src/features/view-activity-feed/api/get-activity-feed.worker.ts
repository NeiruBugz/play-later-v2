import { z } from "zod";

import { getActivityFeedForViewer } from "@/entities/activity-feed/api";
import {
  FeedCursorSchema,
  type ActivityFeedResult,
} from "@/entities/activity-feed/model";
import { UnauthorizedError } from "@/shared/lib/errors";

/**
 * Worker for `getActivityFeedFn` (Slice 20 — social activity feed).
 *
 * Auth-gated: anonymous viewers cannot call this fn. Per-user public
 * activity (`/u/$username/activity`) is exposed by a separate entity query
 * (`getActivityForUser`) — not this worker.
 *
 * The entity query enforces the privacy invariants: only LibraryItem rows
 * owned by `isPublicProfile = true` users that the viewer follows appear in
 * the feed.
 */
export const GET_ACTIVITY_FEED_INPUT = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  cursor: FeedCursorSchema.optional(),
});

export async function getActivityFeedWorker(
  userId: string | undefined,
  data: unknown
): Promise<ActivityFeedResult> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const { limit, cursor } = GET_ACTIVITY_FEED_INPUT.parse(data);

  return getActivityFeedForViewer(userId, { limit, cursor });
}
