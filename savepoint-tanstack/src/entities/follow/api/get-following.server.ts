import { prisma } from "@/shared/lib/db.server";

import type { ListFollowingResult } from "../model/types";

/**
 * List the public accounts that `targetUserId` follows.
 *
 * Privacy invariants:
 *   - Only entries where the FOLLOWED account has `isPublicProfile = true`
 *     appear in the result. Private followed-accounts are silently excluded.
 *   - If the target user itself is non-public (or does not exist), the result
 *     is `{ following: [], total: 0 }` rather than `NotFoundError`.
 *
 * Anonymous-readable: no auth gate at the entity layer.
 */
export async function getFollowing(
  targetUserId: string
): Promise<ListFollowingResult> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { isPublicProfile: true },
  });
  if (!target || !target.isPublicProfile) {
    return { following: [], total: 0 };
  }

  const rows = await prisma.follow.findMany({
    where: {
      followerId: targetUserId,
      following: { isPublicProfile: true },
    },
    select: {
      following: {
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

  const following = rows.map((row) => row.following);
  return { following, total: following.length };
}
