import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import { revalidatePath } from "next/cache";

type CreateReviewInput = {
  gameId: string;
  userId: string;
  rating: number;
  content?: string;
  completedOn?: string;
};

export async function createReview(input: CreateReviewInput) {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    await prisma.review.create({
      data: {
        rating: input.rating,
        content: input.content,
        completedOn: input.completedOn,
        User: {
          connect: {
            id: input.userId,
          },
        },
        Game: {
          connect: {
            id: input.gameId,
          },
        },
      },
    });

    revalidatePath(`/game/${input.gameId}`);
  } catch (e) {
    console.error(e);
  }
}
