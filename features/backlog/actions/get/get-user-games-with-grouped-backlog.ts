import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import { BacklogItemStatus, type BacklogItem, type Game } from "@prisma/client";
import { z } from "zod";


export type GameWithBacklogItems = {
  game: Game;
  backlogItems: Omit<BacklogItem, "game">[];
  totalMainStoryHours?: number;
};

const FilterParamsSchema = z.object({
  platform: z.string().optional().default(""),
  status: z.union([z.nativeEnum(BacklogItemStatus), z.string()]).optional(),
  search: z.string().optional(),
  page: z.number().optional().default(1),
});

export async function getUserGamesWithGroupedBacklog(
  params: Record<string, string>
): Promise<GameWithBacklogItems[]> {
  const userId = await getServerUserId();
  if (!userId) return [];

  const { platform, status, search, page } = FilterParamsSchema.parse(params);

  try {
    const userGames = await prisma.backlogItem.findMany({
      where: {
        userId,
        platform: platform || undefined,
        status: (status as unknown as BacklogItemStatus) || undefined,
        game: search
          ? {
              title: {
                contains: search,
                mode: "insensitive",
              },
            }
          : undefined,
      },
      include: { game: true },
      orderBy: { createdAt: "asc" },
    });

    // Group backlog items by game ID using a Map
    const groupedGames = new Map<string, GameWithBacklogItems>();

    userGames.forEach(({ game, ...backlogItem }) => {
      if (!groupedGames.has(game.id)) {
        groupedGames.set(game.id, { game, backlogItems: [] });
      }
      groupedGames.get(game.id)!.backlogItems.push(backlogItem);
    });

    return Array.from(groupedGames.values());
  } catch (e) {
    console.error("Error fetching user game collection:", e);
    return [];
  }
}