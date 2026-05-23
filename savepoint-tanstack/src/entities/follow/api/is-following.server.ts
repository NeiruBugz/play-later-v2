import { prisma } from "@/shared/lib/db.server";

/**
 * Is `followerUserId` currently following `followingUserId`?
 *
 * Returns a boolean — never throws on a missing row. Privacy-agnostic: the
 * caller is expected to apply visibility rules at the feature/route layer
 * (e.g. only show the "Following" badge to authenticated viewers).
 */
export async function isFollowing(
  followerUserId: string,
  followingUserId: string
): Promise<boolean> {
  const row = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: followerUserId,
        followingId: followingUserId,
      },
    },
    select: { followerId: true },
  });
  return row !== null;
}
