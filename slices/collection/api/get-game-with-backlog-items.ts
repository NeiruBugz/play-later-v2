import { getServerUserId } from "@/auth";
import type { GameWithBacklogItems } from "@/slices/backlog/api/get/get-user-games-with-grouped-backlog";
import { prisma } from "@/src/shared/api";
import { BacklogItemStatus, Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

const ITEMS_PER_PAGE = 24;

const FilterParamsSchema = z.object({
  platform: z.string().optional().default(""),
  status: z.union([z.nativeEnum(BacklogItemStatus), z.string()]).optional(),
  search: z.string().optional(),
  page: z.number().optional().default(1),
});

type FilterParams = z.infer<typeof FilterParamsSchema>;

/**
 * Builds the Prisma 'where' filter for games based on parsed filter parameters and user ID.
 * @param userId - The ID of the user.
 * @param params - The parsed filter parameters.
 * @returns A Prisma 'where' filter object for games.
 */
const buildPrismaGameFilter = (userId: string, params: FilterParams) => {
  const { platform, status, search } = params;

  const backlogItemFilter: Prisma.BacklogItemWhereInput = {
    userId,
    platform: platform || undefined,
    status:
      status === ""
        ? { not: BacklogItemStatus.WISHLIST }
        : {
            equals: status as BacklogItemStatus,
            not: BacklogItemStatus.WISHLIST,
          },
  };

  if (search) {
    backlogItemFilter.game = {
      is: {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
    };
  }

  return {
    backlogItems: {
      some: backlogItemFilter,
    },
  };
};

/**
 * Builds the Prisma 'where' filter for backlog items based on parsed filter parameters and user ID.
 * @param userId - The ID of the user.
 * @param params - The parsed filter parameters.
 * @returns A Prisma 'where' filter object for backlog items.
 */
const buildPrismaBacklogFilter = (userId: string, params: FilterParams) => {
  const { platform, status, search } = params;

  const filter: Prisma.BacklogItemWhereInput = {
    userId,
    platform: platform || undefined,
    status:
      status === ""
        ? { not: BacklogItemStatus.WISHLIST }
        : {
            equals: status as BacklogItemStatus,
            not: BacklogItemStatus.WISHLIST,
          },
  };

  if (search) {
    filter.game = {
      is: {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
    };
  }

  return filter;
};

/**
 * Fetches user games with grouped backlog items in a paginated manner, paginating based on games.
 * @param params - Query parameters including platform, status, search, and page.
 * @returns An object containing the collection of games with backlog items and the total count.
 */
export async function getUserGamesWithGroupedBacklogPaginated(
  params: Record<string, string | number>
): Promise<{ collection: GameWithBacklogItems[]; count: number }> {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      console.error("Unable to find authenticated user");
      redirect("/");
    }

    const parsedParams = FilterParamsSchema.safeParse({
      platform: params.platform,
      status: params.status,
      search: params.search,
      page: Number(params.page), // Ensure 'page' is a number
    });

    if (!parsedParams.success) {
      console.error("Invalid filter parameters:", parsedParams.error.errors);
      return { collection: [], count: 0 };
    }

    const { platform, status, search, page } = parsedParams.data;

    const gameFilter = buildPrismaGameFilter(userId, {
      platform,
      status,
      search,
      page,
    });

    const skip = (page - 1) * ITEMS_PER_PAGE;
    const take = ITEMS_PER_PAGE;

    const [games, totalGames] = await Promise.all([
      prisma.game.findMany({
        where: gameFilter,
        orderBy: { title: "asc" },
        take,
        skip,
        include: {
          backlogItems: {
            where: buildPrismaBacklogFilter(userId, {
              platform,
              status,
              search,
              page,
            }),
          },
        },
      }),
      prisma.game.count({
        where: gameFilter,
      }),
    ]);

    const collection: GameWithBacklogItems[] = games.map((game) => ({
      game,
      backlogItems: game.backlogItems,
    }));

    return { collection, count: totalGames };
  } catch (error) {
    console.error("Error fetching user game collection:", error);
    return { collection: [], count: 0 };
  }
}
