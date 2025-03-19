'use server';

import { prisma } from '@/prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { redirect } from 'next/navigation';
import { getServerUserId } from '@/shared/lib/auth-service';
import { logger } from '@/shared/lib/logger';

const updateBacklogItemSchema = z.object({
  id: z.string(),
  status: z.enum(['TO_PLAY', 'PLAYED', 'PLAYING', 'COMPLETED', 'WISHLIST']),
  acquisitionType: z.enum(['DIGITAL', 'PHYSICAL', 'SUBSCRIPTION']),
  platform: z.string(),
  gameId: z.string(),
});

async function performBacklogItemUpdate(
  id: string,
  userId: string,
  updateData: z.infer<typeof updateBacklogItemSchema>,
) {
  return prisma.backlogItem.update({
    where: { id, userId },
    data: {
      ...updateData,
      updatedAt: new Date(),
      completedAt: updateData.status === 'COMPLETED' ? new Date() : undefined,
    },
  });
}

async function revalidateRelatedPaths(gameId: string) {
  revalidatePath('/collection');
  revalidatePath(`/collection/${gameId}`);
  revalidatePath('/wishlist');
}

export const updateBacklogItem = nextSafeActionClient
  .schema(updateBacklogItemSchema)
  .action(async (input) => {
    logger.info('Update backlog item action called', {
      context: 'updateBacklogItem',
      data: { input },
    });

    const { parsedInput } = input;
    const { id, gameId } = parsedInput;

    logger.debug('Parsed input', {
      context: 'updateBacklogItem',
      data: { parsedInput },
    });

    const userId = await getServerUserId();

    if (!userId) {
      logger.error('No user found', null, { context: 'updateBacklogItem' });
      redirect('/');
    }

    logger.info(`Processing backlog item update`, {
      context: 'updateBacklogItem',
      data: { userId, id, gameId },
    });

    try {
      const updatedItem = await performBacklogItemUpdate(
        id,
        userId,
        parsedInput,
      );

      logger.info('Successfully updated backlog item', {
        context: 'updateBacklogItem',
        data: { updatedItem },
      });

      await revalidateRelatedPaths(gameId);
      logger.debug('Revalidated paths', { context: 'updateBacklogItem' });

      return { success: true };
    } catch (error) {
      logger.error('Failed to update backlog item', error, {
        context: 'updateBacklogItem',
        data: { id, gameId },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
