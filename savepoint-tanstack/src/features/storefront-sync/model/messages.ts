import { z } from "zod";

export const MAX_IMPORTED_GAME_IDS_PER_CHUNK = 200;

export const gatherMessageSchema = z.object({
  v: z.literal(1),
  jobId: z.string().min(1),
});

export const enrichMessageSchema = z.object({
  v: z.literal(1),
  jobId: z.string().min(1),
  chunkIndex: z.number().int().min(0),
  importedGameIds: z
    .array(z.string().min(1))
    .max(MAX_IMPORTED_GAME_IDS_PER_CHUNK),
  lookupCount: z.number().int().min(0),
});

export type GatherMessage = z.infer<typeof gatherMessageSchema>;
export type EnrichMessage = z.infer<typeof enrichMessageSchema>;
