import { prisma } from "@/shared/lib/db.server";

/**
 * Count the public accounts that `targetUserId` follows.
 *
 * Mirrors `getFollowing`'s visibility rule: only counts entries where the
 * followed account has `isPublicProfile = true`. Returns `0` when the target
 * is non-public or missing.
 */
export async function countFollowing(targetUserId: string): Promise<number> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { isPublicProfile: true },
  });
  if (!target || !target.isPublicProfile) {
    return 0;
  }

  return prisma.follow.count({
    where: {
      followerId: targetUserId,
      following: { isPublicProfile: true },
    },
  });
}
