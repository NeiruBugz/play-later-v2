import { z } from "zod";

export const GetRandomWantToPlaySchema = z.object({
  // No input parameters needed - uses authenticated userId from context
});

export type GetRandomWantToPlayInput = z.infer<
  typeof GetRandomWantToPlaySchema
>;
