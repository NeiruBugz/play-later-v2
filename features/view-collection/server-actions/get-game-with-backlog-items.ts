import { BacklogItemStatus, Prisma } from "@prisma/client";

import { prisma } from "@/shared/lib/db";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

import {
  FilterParamsSchema,
  validateFilterParams,
  type FilterParams,
} from "../lib/validation";

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
export const getUserGamesWithGroupedBacklogPaginated = authorizedActionClient
  .metadata({
    actionName: "getUserGamesWithGroupedBacklogPaginated",
    requiresAuth: true,
  })
  .inputSchema(FilterParamsSchema)
  .action(async ({ ctx: { userId }, parsedInput }) => {
    try {
      const parsedParams = validateFilterParams(parsedInput);

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
      return { collection: [], count: 0 };
    }
  });
