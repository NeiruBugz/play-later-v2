import "server-only";

import { prisma } from "@/shared/lib/db";

import { CreateReviewInput } from "./types";

export async function getAllReviewsForGame({ gameId }: { gameId: string }) {
  return await prisma.review.findMany({
    where: { gameId },
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
      completedOn: review.completedOn?.toISOString() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      User: { connect: { id: userId } },
      Game: { connect: { id: gameId } },
    },
  });

  if (!result) {
    throw new Error("Failed to create review");
  }

  return result;
}

export async function aggregateReviewsRatingsForUser({
  userId,
}: {
  userId: string;
}) {
  return await prisma.review.aggregate({
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
