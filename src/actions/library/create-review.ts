"use server";

import { prisma } from "@/src/packages/prisma";
import { z } from "zod";

const createFormSchema = z.object({
  content: z
    .string({
      required_error: "You can't submit empty review",
    })
    .min(1, "You can't submit empty review"),
  gameId: z.string(),
  userId: z.string(),
});

export async function createReview(
  prevState: { message: string },
  createReviewFormData: FormData
) {
  try {
    const validated = createFormSchema.safeParse({
      content: createReviewFormData.get("content"),
      gameId: createReviewFormData.get("gameId"),
      userId: createReviewFormData.get("userId"),
    });

    console.log(validated);

    if (!validated.success) {
      console.log(validated.error.issues);
      const [error] = validated.error.issues.flat();

      return { message: error.message };
    }

    await prisma.review.create({
      data: {
        author: {
          connect: {
            id: validated.data.userId,
          },
        },
        content: validated.data.content,
        createdAt: new Date(),
        game: {
          connect: {
            id: validated.data.gameId,
          },
        },
      },
    });

    return prevState;
  } catch (error) {
    console.log(error);
    return { message: "Something went wrong" };
  }
}
