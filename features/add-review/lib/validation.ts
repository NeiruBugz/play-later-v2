import { z } from "zod";

export const CreateReviewSchema = z.object({
  gameId: z.string().min(1),
  rating: z.number().min(1).max(10),
  content: z.string().optional(),
  completedOn: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

export const ReviewIncludeUser = z.object({
  User: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
});

export type ReviewWithUser = z.infer<typeof ReviewIncludeUser>;
