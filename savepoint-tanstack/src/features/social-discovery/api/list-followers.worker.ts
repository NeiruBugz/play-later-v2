import { z } from "zod";

import { getFollowers } from "@/entities/follow/api/get-followers.server";
import type { ListFollowersResult } from "@/entities/follow/model/types";

/**
 * Worker for `listFollowersFn` (Slice 20 — social-discovery).
 *
 * Anonymous-readable: `userId` is accepted as `string | undefined` and is
 * unused — listing followers is a public read. Privacy enforcement (private
 * follower exclusion + private target → empty list) lives in the entity
 * query `getFollowers`. The worker is a thin Zod-parse + delegate.
 *
 * Private-target outcome (locked in spec): the entity returns
 * `{ followers: [], total: 0 }` rather than throwing — see
 * `entities/follow/api/get-followers.server.ts` rationale (consistent
 * "empty social graph" UX for private profiles).
 */
export const LIST_FOLLOWERS_INPUT = z.object({
  targetUserId: z.string().min(1),
});

export async function listFollowersWorker(
  _userId: string | undefined,
  data: unknown
): Promise<ListFollowersResult> {
  const { targetUserId } = LIST_FOLLOWERS_INPUT.parse(data);
  return getFollowers(targetUserId);
}
