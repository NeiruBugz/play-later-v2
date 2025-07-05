import { z } from "zod";

export const importToApplicationSchema = z.object({
  steamAppId: z.string().transform((val) => Number(val)),
  playtime: z.number().optional(),
});
