import * as z from "zod";

export const addGameSchema = z.object({
  isWishlist: z.boolean().optional(),
  purchaseType: z.enum(["PHYSICAL", "DIGITAL", "SUBSCRIPTION"]).optional(),
  status: z
    .enum([
      "BACKLOG",
      "INPROGRESS",
      "COMPLETED",
      "ABANDONED",
      "SHELVED",
      "FULL_COMPLETION",
    ])
    .optional(),
  title: z.string().min(1),
});

export type AddGameSchema = z.infer<typeof addGameSchema>;
