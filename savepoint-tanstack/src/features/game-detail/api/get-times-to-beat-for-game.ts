import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getTimesToBeat,
  type TimesToBeat,
} from "@/entities/game/api/get-times-to-beat.server";

const inputSchema = z.object({
  igdbId: z.number().int().positive(),
});

export const getTimesToBeatForGameFn = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }): Promise<TimesToBeat | null> => {
    const { igdbId } = inputSchema.parse(data);
    return getTimesToBeat({ igdbId });
  });
