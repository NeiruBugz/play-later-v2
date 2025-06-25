"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/shared/lib/db";
import {
  SteamAchievement,
  SteamAchievementSchema,
  steamWebAPI,
} from "../lib/steam-web-api";

export interface EnrichedAchievement extends SteamAchievement {
  displayName: string;
  description: string;
  icon: string;
  icongray: string;
  hidden: boolean;
  globalPercent?: number;
  rarity: "common" | "uncommon" | "rare" | "very_rare";
}

export async function getUserAchievements(steamAppId: number) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return { error: "Not authenticated" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamId64: true },
    });

    if (!user?.steamId64) {
      return { error: "Steam account not connected" };
    }

    const [userAchievements, schema, globalStats] = await Promise.all([
      steamWebAPI.getUserAchievements(user.steamId64, steamAppId),
      steamWebAPI.getGameAchievementSchema(steamAppId),
      steamWebAPI.getGlobalAchievementPercentages(steamAppId),
    ]);

    if (!userAchievements || !schema) {
      return { error: "Failed to fetch achievement data" };
    }

    const schemaMap = new Map<string, SteamAchievementSchema>();
    schema.game.availableGameStats.achievements?.forEach((ach) => {
      schemaMap.set(ach.name, ach);
    });

    const globalMap = new Map<string, number>();
    globalStats?.achievementpercentages.achievements?.forEach((ach) => {
      globalMap.set(ach.name, ach.percent);
    });

    const enrichedAchievements: EnrichedAchievement[] =
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
          displayName: schemaData?.displayName || ach.apiname,
          description: schemaData?.description || "",
          icon: schemaData?.icon || "",
          icongray: schemaData?.icongray || "",
          hidden: schemaData?.hidden === 1,
          globalPercent,
          rarity,
        };
      });

    const totalAchievements = enrichedAchievements.length;
    const unlockedAchievements = enrichedAchievements.filter(
      (ach) => ach.achieved === 1
    ).length;
    const completionPercentage =
      totalAchievements > 0
        ? (unlockedAchievements / totalAchievements) * 100
        : 0;

    return {
      achievements: enrichedAchievements,
      stats: {
        total: totalAchievements,
        unlocked: unlockedAchievements,
        completionPercentage: Math.round(completionPercentage),
      },
      gameName: userAchievements.gameName,
    };
  } catch (error) {
    console.error("Failed to get user achievements:", error);
    return { error: "Internal server error" };
  }
}
