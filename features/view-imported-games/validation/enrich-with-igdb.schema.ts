import { z } from "zod";

export const enrichWithIGDBSchema = z.object({
  steamAppId: z.string().transform((val) => Number(val)),
});
