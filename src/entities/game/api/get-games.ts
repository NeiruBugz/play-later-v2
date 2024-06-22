import { prisma } from "@/src/shared/api";
import { getServerUserId } from "@/auth";
import type { BacklogItem, BacklogItemStatus, Game } from "@prisma/client";
import { z } from "zod";

type GameWithBacklogItems = {
  game: Game;
  backlogItems: Omit<BacklogItem, 'game'>[];
}

const FilterParamsSchema = z.object({
  platform: z.string().optional().default(""),
  status: z.string().optional().default(""),
})

export async function getUserGamesWithGroupedBacklog(params: Record<string, string>): Promise<GameWithBacklogItems[]> {
  try {
    const userId = await getServerUserId();
    const parsedPayload = FilterParamsSchema.safeParse({
      platform: params.platform,
      status: params.status
    })

    console.log('parsedPayload: ', parsedPayload.data)
    const userGames = await prisma.backlogItem.findMany({
      where: {
        userId: userId,
        platform: parsedPayload.data?.platform === '' ? undefined : parsedPayload.data?.platform,
        status: parsedPayload.data?.status === '' ? undefined : parsedPayload.data?.status as unknown as BacklogItemStatus,
      },
      include: {
        game: true,
      },
    });

    const groupedGames = userGames.reduce((acc: Record<number, GameWithBacklogItems>, item) => {
      const { game, ...backlogItem } = item;
      if (!acc[game.id]) {
        acc[game.id] = { game, backlogItems: [] };
      }
      acc[game.id].backlogItems.push(backlogItem);
      return acc;
    }, {});

    return Object.values(groupedGames);
  } catch (e) {
    console.error('Error fetching user game collection:', e);
    return [];
  }
}
