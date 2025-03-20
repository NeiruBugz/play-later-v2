'use server';

import { prisma } from '@/prisma/client';
import { getServerUserId } from '@/shared/lib/auth-service';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { z } from 'zod';

export const getBacklogItemsByGame = nextSafeActionClient
  .schema(z.object({ gameId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { gameId } = parsedInput;
    const userId = await getServerUserId();

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    try {
      const backlogItems = await prisma.backlogItem.findMany({
        where: {
          gameId,
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: backlogItems,
      };
    } catch (error) {
      console.error('Error fetching backlog items:', error);
      return {
        success: false,
        error: 'Failed to fetch collection entries',
      };
    }
  });
