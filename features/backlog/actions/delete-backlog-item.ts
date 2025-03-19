'use server';

import { prisma } from '../../../prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { nextSafeActionClient } from '../../../shared/lib/next-safe-action-client';
import { redirect } from 'next/navigation';
import { getServerUserId } from '../../../shared/lib/auth-service';

const deleteBacklogItemSchema = z.object({
  id: z.string(),
  gameId: z.string(),
});

async function verifyBacklogItemOwnership(id: string, userId: string) {
  const backlogItem = await prisma.backlogItem.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!backlogItem || backlogItem.userId !== userId) {
    return false;
  }

  return true;
}

async function deleteBacklogItemById(id: string) {
  return prisma.backlogItem.delete({
    where: { id },
  });
}

async function revalidateRelatedPaths(gameId: string) {
  revalidatePath('/collection');
  revalidatePath(`/collection/${gameId}`);
  revalidatePath('/wishlist');
}

export const deleteBacklogItem = nextSafeActionClient
  .schema(deleteBacklogItemSchema)
  .action(async ({ parsedInput }) => {
    const { id, gameId } = parsedInput;

    const userId = await getServerUserId();

    if (!userId) {
      console.error('No user found');
      redirect('/');
    }

    try {
      // First check if the backlog item belongs to the user
      const isOwner = await verifyBacklogItemOwnership(id, userId);

      if (!isOwner) {
        return {
          success: false,
          error:
            'Backlog item not found or you do not have permission to delete it',
        };
      }

      // Delete the backlog item
      await deleteBacklogItemById(id);

      // Revalidate relevant paths
      await revalidateRelatedPaths(gameId);

      return { success: true };
    } catch (error) {
      console.error('Error deleting backlog item:', error);
      return {
        success: false,
        error: 'Failed to delete backlog item',
      };
    }
  });
