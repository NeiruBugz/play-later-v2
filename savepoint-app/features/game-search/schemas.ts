import { z } from "zod";

export const SearchGamesSchema = z.object({
  query: z.string().min(3, "Search query must be at least 3 characters"),
  offset: z.number().int().min(0).optional().default(0),
});

export type SearchGamesInput = z.infer<typeof SearchGamesSchema>;
