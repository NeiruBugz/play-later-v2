import { z } from "zod";

// Steam ID validation (17-digit Steam ID64 or custom URL)
export const steamIdSchema = z.string().min(1, "Steam ID is required");

// Connect Steam request
export const connectSteamSchema = z.object({
  steamId: steamIdSchema,
});

// Imported games query params
export const importedGamesQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  playtimeStatus: z.enum(["all", "played", "never_played"]).default("all"),
  playtimeRange: z
    .enum(["all", "under_1h", "1_to_10h", "10_to_50h", "over_50h"])
    .default("all"),
  platform: z.enum(["all", "windows", "mac", "linux"]).default("all"),
  lastPlayed: z
    .enum(["all", "30_days", "1_year", "over_1_year", "never"])
    .default("all"),
  sortBy: z
    .enum([
      "name_asc",
      "name_desc",
      "playtime_desc",
      "playtime_asc",
      "last_played_desc",
      "last_played_asc",
      "added_desc",
    ])
    .default("name_asc"),
  showAlreadyImported: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((val) => val === "true"),
});

// Import to library action
export const ImportToLibrarySchema = z.object({
  importedGameId: z.string().cuid(),
  status: z.enum(["want_to_play", "owned", "playing", "played"]).optional(),
  manualIgdbId: z.number().int().positive().optional(),
});

// Type inference helpers
export type ConnectSteamInput = z.infer<typeof connectSteamSchema>;
export type ImportedGamesQuery = z.infer<typeof importedGamesQuerySchema>;
export type ImportToLibraryInput = z.infer<typeof ImportToLibrarySchema>;
