import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import type { ReviewItem } from "@/src/shared/types";

export const getReviews = async (): Promise<ReviewItem[]> => {
  try {
    const session = await getServerUserId();
    const reviews = await db.review.findMany({
      include: {
        author: {
          select: {
            name: true,
            username: true,
          },
        },
        game: {
          select: {
            imageUrl: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      where: {
        NOT: {
          author: {
            id: session,
          },
        },
      },
    });

    if (!reviews.length) {
      return [];
    }

    return reviews;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export async function getGameReviews(gameId: string) {
  try {
    const reviews = await db.review.findMany({
      include: {
        author: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      where: {
        gameId,
      },
    });

    return reviews;
  } catch (error) {
    console.log(error);
    return [];
  }
}
