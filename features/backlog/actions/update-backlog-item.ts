'use server';

import { prisma } from '@/prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { redirect } from 'next/navigation';
import { getServerUserId } from '@/shared/lib/auth-service';

const updateBacklogItemSchema = z.object({
  id: z.string(),
  status: z.enum(['TO_PLAY', 'PLAYED', 'PLAYING', 'COMPLETED', 'WISHLIST']),
  acquisitionType: z.enum(['DIGITAL', 'PHYSICAL', 'SUBSCRIPTION']),
  platform: z.string(),
  gameId: z.string(),
});

export const updateBacklogItem = nextSafeActionClient
  .schema(updateBacklogItemSchema)
  .action(async ({ parsedInput }) => {
    const { id, gameId } = parsedInput;

    const userId = await getServerUserId();

    if (!userId) {
      console.error('No user found');
      redirect('/');
    }

    try {
      await prisma.backlogItem.update({
        where: { id, userId },
        data: {
          ...parsedInput,
          updatedAt: new Date(),
        },
      });

      revalidatePath('/collection');
      revalidatePath(`/collection/${gameId}`);
      revalidatePath('/wishlist');

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  });
