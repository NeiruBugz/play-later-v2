import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getTimesToBeat } from "@/entities/game/api/get-times-to-beat.server";

import type { LiveTimesToBeat } from "../ui/times-to-beat-section/times-to-beat-section.type";

const inputSchema = z.object({
  igdbId: z.number().int().positive(),
});

export const getTimesToBeatForGameFn = createServerFn({ method: "GET" })
  .validator((value: unknown) => inputSchema.parse(value))
  .handler(async ({ data }): Promise<LiveTimesToBeat | null> => {
    const { igdbId } = inputSchema.parse(data);
    const times = await getTimesToBeat({ igdbId });
    if (!times) return null;
    return {
      mainStory: times.timeToCreditsSeconds,
      completionist: times.timeToCompleteSeconds,
    };
  });
