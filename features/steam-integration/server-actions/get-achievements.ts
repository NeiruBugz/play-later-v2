"use server";

import { z } from "zod";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import { enrichAchievements } from "../lib/enrich-achievements";
import {
  mapAchievementsSchema,
  mapGlobalAchievements,
} from "../lib/map-achievements";
import { steamWebAPI } from "../lib/steam-web-api";

const getUserAchievementsSchema = z.object({
  steamAppId: z.number(),
});

export const getUserAchievements = authorizedActionClient
  .metadata({
    actionName: "getUserAchievements",
    requiresAuth: true,
  })
  .inputSchema(getUserAchievementsSchema)
  .action(async ({ parsedInput: { steamAppId }, ctx: { userId } }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamId64: true },
    });

    if (!user?.steamId64) {
      throw new Error("Steam account not connected");
    }

    const [userAchievements, schema, globalStats] = await Promise.all([
      steamWebAPI.getUserAchievements(user.steamId64, steamAppId),
      steamWebAPI.getGameAchievementSchema(steamAppId),
      steamWebAPI.getGlobalAchievementPercentages(steamAppId),
    ]);

    if (!schema?.game?.availableGameStats?.achievements?.length) {
      throw new Error("This game does not have any achievements");
    }

    if (!userAchievements || !schema) {
      throw new Error("Failed to fetch achievement data");
    }

    const schemaMap = mapAchievementsSchema(schema);

    const globalMap = mapGlobalAchievements(globalStats);

    const enrichedAchievements = enrichAchievements(
      userAchievements,
      schemaMap,
      globalMap
    );

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
  });
