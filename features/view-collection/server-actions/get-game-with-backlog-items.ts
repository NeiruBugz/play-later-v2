import { getServerUserId } from "@/auth";
import type { GameWithBacklogItems } from "@/features/dashboard/server-actions/get-user-games-with-grouped-backlog";
import { prisma } from "@/shared/lib/db";
import { BacklogItemStatus, Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { validateFilterParams, type FilterParams } from "../lib/validation";

const ITEMS_PER_PAGE = 24;
const DEFAULT_PAGE = 1;

/**
 * Creates a status filter for backlog items
 */
const createStatusFilter = (
  status: string | undefined
): Prisma.BacklogItemWhereInput["status"] => {
  if (!status || status === "") {
    return { not: BacklogItemStatus.WISHLIST };
  }

  return {
    equals: status as BacklogItemStatus,
    not: BacklogItemStatus.WISHLIST,
  };
};

/**
 * Builds a Prisma filter for backlog items based on user ID and filter parameters.
 */
const buildBacklogItemFilter = (
  userId: string,
  params: FilterParams
): Prisma.BacklogItemWhereInput => {
  const { platform, status, search } = params;

  const filter: Prisma.BacklogItemWhereInput = {
    userId,
    platform: platform || undefined,
    status: createStatusFilter(status),
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
 * Calculates pagination parameters with safety checks
 */
const getPaginationParams = (page: number): { skip: number; take: number } => {
  const safePage = Math.max(page || DEFAULT_PAGE, 1);
  return {
    skip: (safePage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  };
};

/**
 * Fetches user games with grouped backlog items in a paginated manner.
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

    const parsedParams = validateFilterParams(params);

    if (!parsedParams.success) {
      console.error("Invalid filter parameters:", parsedParams.error.errors);
      return { collection: [], count: 0 };
    }

    const filterParams = parsedParams.data;
    const backlogItemFilter = buildBacklogItemFilter(userId, filterParams);

    const gameFilter = {
      backlogItems: {
        some: backlogItemFilter,
      },
    };

    const { skip, take } = getPaginationParams(filterParams.page);

    const [games, totalGames] = await prisma.$transaction([
      prisma.game.findMany({
        where: gameFilter,
        orderBy: { title: "asc" },
        take,
        skip,
        include: {
          backlogItems: {
            where: backlogItemFilter,
          },
        },
      }),
      prisma.game.count({
        where: gameFilter,
      }),
    ]);

    return {
      collection: games.map((game) => ({
        game,
        backlogItems: game.backlogItems,
      })),
      count: totalGames,
    };
  } catch (error) {
    console.error("Error fetching user game collection:", error);
    // Consider throwing the error instead of returning empty results
    // to allow for consistent error handling at a higher level
    return { collection: [], count: 0 };
  }
}
