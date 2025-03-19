'use server';

import { getServerUserId } from '@/shared/lib/auth-service';
import { prisma } from '@/prisma/client';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';

const platformValidator = z.object({
  platform: z.string(),
});

const INITIAL_PLATFORMS = [
  { platform: 'pc' },
  { platform: 'playstation' },
  { platform: 'nintendo' },
  { platform: 'xbox' },
  { platform: 'all' },
];

async function fetchUserPlatforms(userId: string) {
  return prisma.backlogItem.findMany({
    where: {
      userId,
    },
    select: {
      platform: true,
    },
    distinct: ['platform'],
  });
}

function validatePlatforms(
  platforms: Array<{ platform: unknown }>,
): Array<{ platform: string }> {
  const result: Array<{ platform: string }> = [];

  platforms.forEach((platform) => {
    const validated = platformValidator.safeParse(platform);

    if (validated.success) {
      result.push({ platform: validated.data.platform });
    }
  });

  return result;
}

export const getUniqueUserPlatforms = nextSafeActionClient
  .schema(z.object({}))
  .action(async () => {
    const userId = await getServerUserId();

    if (!userId) {
      redirect('/');
    }

    const platforms = await fetchUserPlatforms(userId);

    if (platforms.length === 0) {
      return INITIAL_PLATFORMS;
    }

    return validatePlatforms(platforms);
  });
