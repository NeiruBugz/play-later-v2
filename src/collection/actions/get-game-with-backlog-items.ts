import { getServerUserId } from "@/auth";
import { GameWithBacklogItems } from "@/src/entities/backlog-item/model/get-backlog-items";
import { prisma } from "@/src/shared/api";
import { BacklogItemStatus } from "@prisma/client";
import { z } from "zod";

const FilterParamsSchema = z.object({
  platform: z.string().optional().default(""),
  status: z.union([z.nativeEnum(BacklogItemStatus), z.string()]).optional(),
  search: z.string().optional(),
  page: z.number().optional().default(1),
});

export async function getUserGamesWithGroupedBacklog(
  params: Record<string, string | number>
): Promise<{ collection: GameWithBacklogItems[]; count: number }> {
  try {
    const userId = await getServerUserId();
    const parsedPayload = FilterParamsSchema.safeParse({
      platform: params.platform,
      status: params.status,
      search: params.search,
      page: params.page,
    });

    if (!parsedPayload.success) {
      console.error("Invalid filter parameters:", parsedPayload.error.errors);
      return { collection: [], count: 0 };
    }

    const userGames = await prisma.backlogItem.findMany({
      where: {
        userId: userId,
        platform: parsedPayload.data.platform || undefined,
        status: {
          not: BacklogItemStatus.WISHLIST,
          equals:
            parsedPayload.data.status === ""
              ? undefined
              : (parsedPayload.data.status as BacklogItemStatus),
        },
        game: {
          OR: parsedPayload.data.search
            ? [
              {
                title: {
                  contains: parsedPayload.data.search,
                  mode: "insensitive",
                },
              },
            ]
            : undefined,
        },
      },
      include: {
        game: true,
      },
      orderBy: {
        game: {
          title: "asc",
        },
      },
      take: 24,
      skip: (parsedPayload.data.page - 1) * 24,
    });

    const userGamesCount = await prisma.backlogItem.count({
      where: {
        userId: userId,
        platform: parsedPayload.data.platform || undefined,
        status: {
          not: BacklogItemStatus.WISHLIST,
          equals:
            parsedPayload.data.status === ""
              ? undefined
              : (parsedPayload.data.status as BacklogItemStatus),
        },
        game: {
          OR: parsedPayload.data.search
            ? [
              {
                title: {
                  contains: parsedPayload.data.search,
                  mode: "insensitive",
                },
              },
            ]
            : undefined,
        },
      },
      orderBy: {
        game: {
          title: "asc",
        },
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

    return { collection: Object.values(groupedGames), count: userGamesCount };
  } catch (e) {
    console.error("Error fetching user game collection:", e);

    return { collection: [], count: 0 };
  }
}
