import { z } from "zod";

export const GET_PLATFORM_OPTIONS_INPUT = z.object({
  gameId: z.string().min(1),
});

/** Section headings for the grouped Platform combobox. */
export const PLATFORM_GROUP_LABELS = {
  game: "This game",
  user: "Your platforms",
} as const;

/** One labeled section of the Platform combobox. */
export type PlatformOptionGroup = { label: string; platforms: string[] };

/**
 * Platform options grouped by provenance so the combobox can visually separate
 * the game's platforms from the user's own logged platforms.
 */
export type PlatformOptions = PlatformOptionGroup[];
