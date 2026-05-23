import { prisma } from "@/shared/lib/db.server";

import type { ListFollowersResult } from "../model/types";

/**
 * List the public followers of `targetUserId`.
 *
 * Privacy invariants:
 *   - Only followers with `isPublicProfile = true` appear in the result.
 *     Private followers are silently excluded.
 *   - If the target user itself is non-public (or does not exist), the result
 *     is `{ followers: [], total: 0 }` rather than `NotFoundError`. Rationale:
 *     listing a non-public profile's social graph should render the same
 *     "empty" UX as a public profile with no followers — no error page.
 *
 * Anonymous-readable: no auth gate at the entity layer.
 */
export async function getFollowers(
  targetUserId: string
): Promise<ListFollowersResult> {
  // If the target is non-public (or missing), the user-existence check below
  // collapses to "no visible social graph". We don't throw — the privacy
  // invariant collapses "missing" and "private" into the empty-list outcome.
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { isPublicProfile: true },
  });
  if (!target || !target.isPublicProfile) {
    return { followers: [], total: 0 };
  }

  const rows = await prisma.follow.findMany({
    where: {
      followingId: targetUserId,
      follower: { isPublicProfile: true },
    },
    select: {
      follower: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const followers = rows.map((row) => row.follower);
  return { followers, total: followers.length };
}
