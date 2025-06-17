import { z } from "zod";

const CreateReviewSchema = z.object({
  gameId: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(10),
  content: z.string().optional(),
  completedOn: z.string().optional(),
});

export const validateCreateReview = (formData: FormData) => {
  return CreateReviewSchema.safeParse({
    gameId: formData.get("gameId"),
    userId: formData.get("userId"),
    rating: Number(formData.get("rating")),
    content: formData.get("content"),
    completedOn: formData.get("completedOn"),
  });
};
