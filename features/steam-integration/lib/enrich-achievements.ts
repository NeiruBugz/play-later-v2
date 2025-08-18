import {
  type EnrichedAchievement,
  type SteamAchievementSchema,
  type SteamPlayerAchievements,
} from "../types/type";

export const enrichAchievements = (
  userAchievements: SteamPlayerAchievements,
  schemaMap: Map<string, SteamAchievementSchema>,
  globalMap: Map<string, number>
) =>
  userAchievements.achievements.map((ach) => {
    const schemaData = schemaMap.get(ach.apiname);
    const globalPercent = globalMap.get(ach.apiname);

    let rarity: EnrichedAchievement["rarity"] = "common";
    if (globalPercent !== undefined) {
      if (globalPercent < 5) rarity = "very_rare";
      else if (globalPercent < 15) rarity = "rare";
      else if (globalPercent < 50) rarity = "uncommon";
    }

    return {
      ...ach,
      displayName: schemaData?.displayName ?? ach.apiname,
      description: schemaData?.description ?? "",
      icon: schemaData?.icon ?? "",
      icongray: schemaData?.icongray ?? "",
      hidden: schemaData?.hidden === 1,
      globalPercent,
      rarity,
    };
  });
