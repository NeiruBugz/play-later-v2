import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import { BacklogItemStatus, type BacklogItem, type Game } from "@prisma/client";
import { z } from "zod";

type GameWithBacklogItems = {
  game: Game;
  backlogItems: Omit<BacklogItem, "game">[];
};

const FilterParamsSchema = z.object({
  platform: z.string().optional().default(""),
  status: z.union([z.nativeEnum(BacklogItemStatus), z.string()]).optional(),
});

export async function getUserGamesWithGroupedBacklog(
  params: Record<string, string>
): Promise<GameWithBacklogItems[]> {
  try {
    const userId = await getServerUserId();
    const parsedPayload = FilterParamsSchema.safeParse({
      platform: params.platform,
      status: params.status,
    });

    if (!parsedPayload.success) {
      console.error("Invalid filter parameters:", parsedPayload.error.errors);
      return [];
    }

    const userGames = await prisma.backlogItem.findMany({
      where: {
        userId: userId,
        platform: parsedPayload.data.platform || undefined,
        status:
          parsedPayload.data.status === ""
            ? undefined
            : (parsedPayload.data.status as BacklogItemStatus),
      },
      include: {
        game: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const groupedGames = userGames.reduce(
      (acc: Record<string, GameWithBacklogItems>, item) => {
        const { game, ...backlogItem } = item;
        if (!acc[game.id]) {
          acc[game.id] = { game, backlogItems: [] };
        }
        acc[game.id].backlogItems.push(backlogItem);
        return acc;
      },
      {}
    );

    return Object.values(groupedGames);
  } catch (e) {
    console.error("Error fetching user game collection:", e);
    return [];
  }
}
