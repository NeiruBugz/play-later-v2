import { prisma } from "@/src/shared/api";

export async function getReviews(gameId: string) {
  try {
    return prisma.review.findMany({
      where: {
        gameId,
      },
      include: {
        User: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}
