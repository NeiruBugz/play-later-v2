import { z } from "zod";

import { prisma } from "@/shared/lib/db.server";
import { UnauthorizedError } from "@/shared/lib/errors";

/**
 * Worker for `unfollowUserFn` (Slice 20 — social graph).
 *
 * Idempotency rule: `deleteMany` never throws on a missing row, so a second
 * call (or a call for a pair that was never followed) is a natural no-op —
 * NOT a `NotFoundError`. Mirrors canonical `deleteFollow` behaviour.
 *
 * Self-unfollow is not a distinct case: self-follow rows cannot exist
 * (blocked by `followUserWorker`), so unfollowing self simply deletes 0 rows.
 */
export const UNFOLLOW_USER_INPUT = z.object({
  targetUserId: z.string().min(1),
});

export async function unfollowUserWorker(
  userId: string | undefined,
  data: unknown
): Promise<void> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const { targetUserId } = UNFOLLOW_USER_INPUT.parse(data);

  await prisma.follow.deleteMany({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });
}
