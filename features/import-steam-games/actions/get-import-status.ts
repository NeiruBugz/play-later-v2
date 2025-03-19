'use server';
import { auth } from '@/auth';
import { prisma } from '@/prisma/client';
import { logger } from '@/shared/lib/logger';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { z } from 'zod';

export const getBulkImportStatus = nextSafeActionClient
  .schema(z.object({ jobId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { jobId } = parsedInput;
    const context = 'getBulkImportStatus';

    try {
      logger.debug(`Getting status for job: ${jobId}`, { context });

      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        logger.warn('Authentication required for getting job status', {
          context,
        });
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const userId = session.user.id;

      // Get the import job
      const importJob = await prisma.steamImportJob.findFirst({
        where: {
          id: jobId,
          userId,
        },
      });

      if (!importJob) {
        logger.warn(`Import job not found: ${jobId}`, {
          context,
          data: { userId, jobId },
        });

        return {
          success: false,
          error: 'Import job not found',
        };
      }

      logger.debug(`Found import job: ${jobId}, status: ${importJob.status}`, {
        context,
        data: {
          jobId,
          status: importJob.status,
          progress:
            importJob.processedGames && importJob.totalGames
              ? `${importJob.processedGames}/${importJob.totalGames}`
              : 'unknown',
        },
      });

      return {
        success: true,
        job: importJob,
      };
    } catch (error) {
      logger.error('Error getting bulk import status', error, {
        context,
        data: { jobId },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
