import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getRelatedGames } from "@/entities/game/api/get-related-games.server";

const inputSchema = z.object({
  collectionId: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});

export const getRelatedGamesFn = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }) => getRelatedGames(data));
