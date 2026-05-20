import { prisma } from "@/shared/lib/db.server";

/**
 * Count the public followers of `targetUserId`.
 *
 * Mirrors `getFollowers`'s visibility rule: only counts followers with
 * `isPublicProfile = true`. Returns `0` (not an error) when the target is
 * non-public or missing — see `getFollowers` for the rationale.
 */
export async function countFollowers(targetUserId: string): Promise<number> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { isPublicProfile: true },
  });
  if (!target || !target.isPublicProfile) {
    return 0;
  }

  return prisma.follow.count({
    where: {
      followingId: targetUserId,
      follower: { isPublicProfile: true },
    },
  });
}
