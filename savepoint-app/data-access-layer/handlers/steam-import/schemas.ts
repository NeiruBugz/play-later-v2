import { z } from "zod";

const steamIdSchema = z.string().min(1, "Steam ID is required");

export const connectSteamSchema = z.object({
  steamId: steamIdSchema,
});
export type ConnectSteamInput = z.infer<typeof connectSteamSchema>;
