'use server';

import { prisma } from '@/infra/prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { nextSafeActionClient } from '@/infra/next-safe-action-client';
import { getServerUserId } from '@/domain/auth/auth-service';
import { redirect } from 'next/navigation';

const updateBacklogItemSchema = z.object({
  id: z.number(),
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
  });
