import "server-only";

import { Prisma, type Follow } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";

import { DuplicateError } from "../errors";
import type {
  PaginatedFollowersResult,
  PaginatedFollowingResult,
  PaginationOptions,
} from "./types";

const FOLLOWER_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  image: true,
} satisfies Prisma.UserSelect;

export async function createFollow(
  followerId: string,
  followingId: string
): Promise<Follow> {
  try {
    return await prisma.follow.create({
      data: { followerId, followingId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DuplicateError("Already following this user");
    }
    throw error;
  }
}

export async function deleteFollow(
  followerId: string,
  followingId: string
): Promise<void> {
  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });
}

export async function findFollowers(
  userId: string,
  opts?: PaginationOptions
): Promise<PaginatedFollowersResult> {
  const publicFilter = {
    followingId: userId,
    follower: { isPublicProfile: true },
  };

  const [follows, total] = await prisma.$transaction([
    prisma.follow.findMany({
      where: publicFilter,
      select: {
        follower: { select: FOLLOWER_USER_SELECT },
      },
      orderBy: [{ createdAt: "desc" }, { followerId: "desc" }],
      ...(opts?.skip !== undefined && { skip: opts.skip }),
      ...(opts?.take !== undefined && { take: opts.take }),
    }),
    prisma.follow.count({ where: publicFilter }),
  ]);

  return {
    followers: follows.map((f) => f.follower),
    total,
  };
}

export async function findFollowing(
  userId: string,
  opts?: PaginationOptions
): Promise<PaginatedFollowingResult> {
  const publicFilter = {
    followerId: userId,
    following: { isPublicProfile: true },
  };

  const [follows, total] = await prisma.$transaction([
    prisma.follow.findMany({
      where: publicFilter,
      select: {
        following: { select: FOLLOWER_USER_SELECT },
      },
      orderBy: [{ createdAt: "desc" }, { followingId: "desc" }],
      ...(opts?.skip !== undefined && { skip: opts.skip }),
      ...(opts?.take !== undefined && { take: opts.take }),
    }),
    prisma.follow.count({ where: publicFilter }),
  ]);

  return {
    following: follows.map((f) => f.following),
    total,
  };
}

export async function countFollowers(userId: string): Promise<number> {
  return prisma.follow.count({ where: { followingId: userId } });
}

export async function countFollowing(userId: string): Promise<number> {
  return prisma.follow.count({ where: { followerId: userId } });
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
    select: { followerId: true },
  });
  return follow !== null;
}
