import * as z from "zod";

export const addGameSchema = z.object({
  platform: z.string().optional(),
  status: z.enum([
    "BACKLOG",
    "INPROGRESS",
    "COMPLETED",
    "ABANDONED",
    "FULL_COMPLETION",
  ]),
  title: z.string().min(1),
  purchaseType: z.enum(["PHYSICAL", "DIGITAL", "SUBSCRIPTION"]).optional(),
  isWishlist: z.boolean().optional(),
});

export type AddGameSchema = z.infer<typeof addGameSchema>;
