import { getServerUserId } from '@/shared/lib/auth-service';
import { prisma } from '@/prisma/client';
import { redirect } from 'next/navigation';
import { z } from 'zod';

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

export async function getUniqueUserPlatforms(): Promise<
  { platform: string }[]
> {
  const userId = await getServerUserId();

  if (!userId) {
    redirect('/');
  }

  const result: Array<{ platform: string }> = [];

  const platforms = await prisma.backlogItem.findMany({
    where: {
      userId,
    },
    select: {
      platform: true,
    },
    distinct: ['platform'],
  });

  if (platforms.length === 0) {
    return INITIAL_PLATFORMS;
  }

  platforms.forEach((platform) => {
    const validated = platformValidator.safeParse(platform);

    if (validated.success) {
      return result.push({ platform: validated.data.platform });
    }
  });

  return result;
}
