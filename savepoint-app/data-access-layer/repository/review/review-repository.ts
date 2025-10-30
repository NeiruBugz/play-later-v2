import "server-only";

import { prisma } from "@/shared/lib";

import { type CreateReviewInput, type GetReviewsForGameInput } from "./types";

export async function getAllReviewsForGame({
  gameId,
  userId,
}: GetReviewsForGameInput) {
  return prisma.review.findMany({
    where: {
      gameId,
      ...(userId ? { userId } : {}),
    },
    include: {
      User: {
        select: {
          name: true,
          image: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReview({
  review,
  userId,
  gameId,
}: CreateReviewInput) {
  const result = await prisma.review.create({
    data: {
      content: review.content,
      rating: review.rating,
      completedOn: review.completedOn,
      createdAt: new Date(),
      updatedAt: new Date(),
      User: { connect: { id: userId } },
      Game: { connect: { id: gameId } },
    },
  });

  return result;
}

export async function aggregateReviewsRatingsForUser({
  userId,
}: {
  userId: string;
}) {
  return prisma.review.aggregate({
    where: { userId },
    _avg: { rating: true },
  });
}

export async function getRecentReviews({ userId }: { userId: string }) {
  return prisma.review.findMany({
    where: { userId },
    include: {
      Game: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 2,
  });
}
