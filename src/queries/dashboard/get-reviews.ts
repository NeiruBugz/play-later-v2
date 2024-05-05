import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { ReviewItem } from "@/src/types/dashboard/review";

export const getReviews = async (): Promise<ReviewItem[]> => {
  try {
    const session = await getServerUserId();
    const reviews = await prisma.review.findMany({
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
    const reviews = await prisma.review.findMany({
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
