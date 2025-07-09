import type {
  SteamAchievement,
  SteamAchievementSchema,
  SteamGameSchema,
  SteamGlobalAchievementPercentages,
} from "../types/type";

export interface EnrichedAchievement extends SteamAchievement {
  displayName: string;
  description: string;
  icon: string;
  icongray: string;
  hidden: boolean;
  globalPercent?: number;
  rarity: "common" | "uncommon" | "rare" | "very_rare";
}

export const mapAchievementsSchema = (schema: SteamGameSchema) => {
  const schemaMap = new Map<string, SteamAchievementSchema>();
  schema.game.availableGameStats.achievements?.forEach((ach) => {
    schemaMap.set(ach.name, ach);
  });

  return schemaMap;
};

export const mapGlobalAchievements = (
  globalStats: SteamGlobalAchievementPercentages | null
) => {
  const globalMap = new Map<string, number>();
  if (!globalStats) {
    return globalMap;
  }

  globalStats?.achievementpercentages.achievements?.forEach((ach) => {
    globalMap.set(ach.name, ach.percent);
  });

  return globalMap;
};
