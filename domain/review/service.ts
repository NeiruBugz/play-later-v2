import { prisma } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";
import { CreateReviewInput } from "./types";

export const ReviewService = {
  getAll: async (gameId: string) => {
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
  },
  create: async (payload: CreateReviewInput) => {
    try {
      await prisma.review.create({
        data: {
          rating: payload.rating,
          content: payload.content,
          completedOn: payload.completedOn,
          User: {
            connect: {
              id: payload.userId,
            },
          },
          Game: {
            connect: {
              id: payload.gameId,
            },
          },
        },
      });

      revalidatePath(`/game/${payload.gameId}`);
    } catch (e) {
      console.error(e);
    }
  },
};
