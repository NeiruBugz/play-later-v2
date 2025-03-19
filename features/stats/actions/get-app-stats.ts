'use server';

import { prisma } from '@/prisma/client';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { z } from 'zod';

export type AppStats = {
  activeUsers: number;
  gamesTracked: number;
  statusCategories: number;
};

/**
 * Get application statistics
 * - Count of active users (users with at least one backlog item)
 * - Count of games tracked (total backlog items)
 * - Status categories count (hardcoded as 3 - playing, completed, backlog)
 */
export const getAppStats = nextSafeActionClient
  .schema(z.object({}))
  .action(async () => {
    try {
      // Get count of active users (users with at least one backlog item)
      const activeUsersCount = await prisma.user.count({
        where: {
          backlogItems: {
            some: {},
          },
          deleted: false,
        },
      });

      // Get count of games tracked (total backlog items excluding wishlist)
      const gamesTrackedCount = await prisma.backlogItem.count({
        where: {
          status: {
            not: 'WISHLIST',
          },
        },
      });

      // Status categories count - we have 3 main statuses: TO_PLAY, PLAYING, COMPLETED
      const statusCategoriesCount = 3;

      return {
        activeUsers: activeUsersCount,
        gamesTracked: gamesTrackedCount,
        statusCategories: statusCategoriesCount,
      };
    } catch (error) {
      console.error('Error fetching app stats:', error);
      return {
        activeUsers: 0,
        gamesTracked: 0,
        statusCategories: 3,
      };
    }
  });
