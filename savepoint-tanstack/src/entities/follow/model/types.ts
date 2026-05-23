import { z } from "zod";

/**
 * Follow entity types.
 *
 * The `Follow` Prisma row links a `followerId` (the user doing the following)
 * to a `followingId` (the user being followed). Listing followers / following
 * returns a slim public-user shape (id, name, username, image) — these are the
 * fields callers need to render a user card or link.
 */

export const FollowSchema = z.object({
  followerId: z.string().min(1),
  followingId: z.string().min(1),
  createdAt: z.date(),
});

export type Follow = z.infer<typeof FollowSchema>;

export const PublicUserRefSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullable(),
  username: z.string().nullable(),
  image: z.string().nullable(),
});

export type PublicUserRef = z.infer<typeof PublicUserRefSchema>;

export const ListFollowersResultSchema = z.object({
  followers: z.array(PublicUserRefSchema),
  total: z.number().int().nonnegative(),
});

export type ListFollowersResult = z.infer<typeof ListFollowersResultSchema>;

export const ListFollowingResultSchema = z.object({
  following: z.array(PublicUserRefSchema),
  total: z.number().int().nonnegative(),
});

export type ListFollowingResult = z.infer<typeof ListFollowingResultSchema>;
