import { z } from "zod";
import { zfd } from "zod-form-data";

export const CreateReviewFormSchema = zfd.formData({
  gameId: zfd.text(),
  rating: zfd.numeric(),
  content: zfd.text(),
  completedOn: zfd.text(),
});

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
