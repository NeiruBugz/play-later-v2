import { z } from "zod";

export interface SteamAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
  name?: string;
  description?: string;
}

export interface SteamAchievementSchema {
  name: string;
  defaultvalue: number;
  displayName: string;
  hidden: number;
  description: string;
  icon: string;
  icongray: string;
}

export interface SteamPlayerAchievements {
  steamID: string;
  gameName: string;
  achievements: SteamAchievement[];
  success: boolean;
}

export interface SteamGameSchema {
  game: {
    gameName: string;
    gameVersion: string;
    availableGameStats: {
      achievements: SteamAchievementSchema[];
    };
  };
}

export interface SteamGlobalAchievementPercentages {
  achievementpercentages: {
    achievements: Array<{
      name: string;
      percent: number;
    }>;
  };
}

export interface SteamUserOwnedGames {
  game_count: number;
  games: SteamGame[];
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
  img_logo_url?: string;
}

export interface EnrichedAchievement extends SteamAchievement {
  displayName: string;
  description: string;
  icon: string;
  icongray: string;
  hidden: boolean;
  globalPercent?: number;
  rarity: "common" | "uncommon" | "rare" | "very_rare";
}

export const SteamGameSchema = z.object({
  name: z.string(),
  storefrontGameId: z.string(),
  playtime: z.number(),
  img_icon_url: z.string().optional(),
  img_logo_url: z.string().optional(),
});

export const SaveManySteamGamesInput = z.object({
  games: z.array(SteamGameSchema),
});

export type SaveManySteamGamesInput = z.infer<typeof SaveManySteamGamesInput>;
