import { z } from "zod";

export const GetRandomWishlistGameSchema = z.object({
  // No input parameters needed - uses authenticated userId from context
});

export type GetRandomWishlistGameInput = z.infer<
  typeof GetRandomWishlistGameSchema
>;
