import { z } from "zod";

import { prisma } from "@/shared/lib/db.server";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/lib/errors";

/**
 * Worker for `followUserFn`.
 *
 * Locked divergences from canonical:
 *   - Self-follow → `ValidationError` (canonical: `ConflictError`).
 *     Rationale: self-follow is a semantic input error, not a constraint
 *     conflict.
 *   - Double-follow → no-op void (canonical: `ConflictError` on P2002).
 *     We use `upsert` so client retry storms surface no error. Mirrors the
 *     Slice 10 `addGameToLibrary` idempotency precedent.
 *
 * Privacy invariant: target must exist AND be public. Missing target and
 * non-public target collapse to the same `NotFoundError` to prevent profile
 * enumeration attacks.
 */
export const FOLLOW_USER_INPUT = z.object({
  targetUserId: z.string().min(1),
});

export async function followUserWorker(
  userId: string | undefined,
  data: unknown
): Promise<void> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const { targetUserId } = FOLLOW_USER_INPUT.parse(data);

  if (userId === targetUserId) {
    throw new ValidationError("You cannot follow yourself");
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { isPublicProfile: true },
  });
  if (!target || !target.isPublicProfile) {
    throw new NotFoundError("User not found");
  }

  // Idempotent: a second call for the same (followerId, followingId) pair is a no-op.
  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: userId,
        followingId: targetUserId,
      },
    },
    create: {
      followerId: userId,
      followingId: targetUserId,
    },
    update: {},
  });
}
