import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import {
  BacklogItemStatus,
  User,
  type BacklogItem,
  type Game,
} from "@prisma/client";
import { z } from "zod";

type GameWithBacklogItems = {
  game: Game;
  backlogItems: Omit<BacklogItem, "game">[];
  totalMainStoryHours?: number;
};

const FilterParamsSchema = z.object({
  platform: z.string().optional().default(""),
  status: z.union([z.nativeEnum(BacklogItemStatus), z.string()]).optional(),
  search: z.string().optional(),
});

export async function getUserGamesWithGroupedBacklog(
  params: Record<string, string>
): Promise<GameWithBacklogItems[]> {
  try {
    const userId = await getServerUserId();
    const parsedPayload = FilterParamsSchema.safeParse({
      platform: params.platform,
      status: params.status,
      search: params.search,
    });

    if (!parsedPayload.success) {
      console.error("Invalid filter parameters:", parsedPayload.error.errors);
      return [];
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

type UserWithBacklogItems = {
  user: User;
  backlogItems: (BacklogItem & { game: Game })[];
};

export async function getBacklogs() {
  try {
    const userId = await getServerUserId();

    const userGames = await prisma.backlogItem.findMany({
      where: {
        userId: { not: userId },
      },
      include: {
        game: true,
        User: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const groupedByUser = userGames.reduce(
      (acc: Record<string, UserWithBacklogItems>, item) => {
        const { User, ...backlogItem } = item;
        if (!acc[User.id]) {
          acc[User.id] = { user: User, backlogItems: [] };
        }
        acc[User.id].backlogItems.push(item);
        return acc;
      },
      {}
    );

    return Object.values(groupedByUser);
  } catch (e) {
    console.error("Error fetching user game collection:", e);
    return [];
  }
}

export async function getUsersBacklog({ backlogId }: { backlogId: string }) {
  try {
    console.log(backlogId);
    return await prisma.backlogItem.findMany({
      where: {
        userId: backlogId,
      },
      include: {
        game: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (e) {
    console.error("Error fetching user game collection:", e);
    return [];
  }
}
