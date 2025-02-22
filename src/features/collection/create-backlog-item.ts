'use server';

import { z } from 'zod';
import { nextSafeActionClient } from '@/infra/next-safe-action-client';
import { prisma } from '@/infra/prisma/client';
import { revalidatePath } from 'next/cache';

const createBacklogItemSchema = z.object({
  status: z.enum(['TO_PLAY', 'PLAYED', 'PLAYING', 'COMPLETED', 'WISHLIST']),
  acquisitionType: z.enum(['DIGITAL', 'PHYSICAL', 'SUBSCRIPTION']),
  platform: z.string(),
  gameId: z.string(),
  userId: z.string(),
});

export const createBacklogItem = nextSafeActionClient
  .schema(createBacklogItemSchema)
  .action(async ({ parsedInput }) => {
    const { userId, gameId, ...backlogItemInput } = parsedInput;

    await prisma.backlogItem.create({
      data: {
        userId,
        gameId,
        ...backlogItemInput,
      },
    });
    revalidatePath('/collection');
    revalidatePath(`/collection/${gameId}`);
    revalidatePath('/wishlist');
  });
