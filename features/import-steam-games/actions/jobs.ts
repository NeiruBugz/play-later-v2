'use server';

import { auth } from '@/auth';
import { prisma } from '@/prisma/client';
import { logger } from '@/shared/lib/logger';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';

export const getImportJobs = nextSafeActionClient.action(async () => {
  const context = 'getImportJobs';

  try {
    logger.debug('Getting import jobs for user', { context });

    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      logger.warn('Authentication required for getting import jobs', {
        context,
      });
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const userId = session.user.id;

    // Get all import jobs for the user
    const importJobs = await prisma.steamImportJob.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.debug(`Found ${importJobs.length} import jobs for user`, {
      context,
      data: { count: importJobs.length },
    });

    return {
      success: true,
      jobs: importJobs,
    };
  } catch (error) {
    logger.error('Error getting import jobs', error, { context });

    return {
      success: false,
      jobs: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
