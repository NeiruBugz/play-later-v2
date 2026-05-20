import { z } from "zod";

import { getFollowing } from "@/entities/follow/api";
import type { ListFollowingResult } from "@/entities/follow/model/types";

/**
 * Worker for `listFollowingFn` (Slice 20 — social-discovery).
 *
 * Anonymous-readable: `userId` is unused. Privacy enforcement (private
 * followed-account exclusion + private target → empty list) lives in the
 * entity query `getFollowing`.
 */
export const LIST_FOLLOWING_INPUT = z.object({
  targetUserId: z.string().min(1),
});

export async function listFollowingWorker(
  _userId: string | undefined,
  data: unknown
): Promise<ListFollowingResult> {
  const { targetUserId } = LIST_FOLLOWING_INPUT.parse(data);
  return getFollowing(targetUserId);
}
