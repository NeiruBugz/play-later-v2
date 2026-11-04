import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getRelatedCollectionsForGame } from "@/entities/game/api/get-related-collections-for-game.server";

const inputSchema = z.object({
  igdbId: z.number().int().positive(),
});

export const getRelatedCollectionsFn = createServerFn({ method: "GET" })
  .validator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }) => {
    const { igdbId } = inputSchema.parse(data);
    return getRelatedCollectionsForGame({ igdbId });
  });
