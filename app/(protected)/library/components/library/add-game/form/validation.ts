import * as z from "zod";

export const addGameSchema = z.object({
  status: z
    .enum([
      "BACKLOG",
      "INPROGRESS",
      "COMPLETED",
      "ABANDONED",
      "FULL_COMPLETION",
    ])
    .optional(),
  title: z.string().min(1),
  purchaseType: z.enum(["PHYSICAL", "DIGITAL", "SUBSCRIPTION"]).optional(),
  isWishlist: z.boolean().optional(),
});

export type AddGameSchema = z.infer<typeof addGameSchema>;
