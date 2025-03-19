'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/prisma/client';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';

import { logger } from '@/shared/lib/logger';

/**
 * Get failed imports for a specific job
 */
export const getFailedImports = nextSafeActionClient
  .schema(z.object({ jobId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { jobId } = parsedInput;
    const context = 'getFailedImports';

    try {
      logger.debug(`Getting failed imports for job: ${jobId}`, { context });

      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        logger.warn('Authentication required for getting failed imports', {
          context,
        });
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const userId = session.user.id;

      // Get failed imports for the job
      const failedImports = await prisma.failedImport.findMany({
        where: {
          userId,
          steamImportJobId: jobId,
          errorMessage: { not: null }, // Only get actual failures
        },
        orderBy: {
          attemptedAt: 'desc',
        },
      });

      logger.debug(
        `Found ${failedImports.length} failed imports for job: ${jobId}`,
        {
          context,
          data: { count: failedImports.length },
        },
      );

      return {
        success: true,
        failedImports,
      };
    } catch (error) {
      logger.error('Error getting failed imports', error, {
        context,
        data: { jobId },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

/**
 * Get skipped imports for a specific job
 */
export const getSkippedImports = nextSafeActionClient
  .schema(z.object({ jobId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { jobId } = parsedInput;
    const context = 'getSkippedImports';

    try {
      logger.debug(`Getting skipped imports for job: ${jobId}`, { context });

      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        logger.warn('Authentication required for getting skipped imports', {
          context,
        });
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const userId = session.user.id;

      // Get skipped imports for the job
      const skippedImports = await prisma.failedImport.findMany({
        where: {
          userId,
          steamImportJobId: jobId,
          errorMessage: null, // Skipped games don't have error messages
        },
        orderBy: {
          attemptedAt: 'desc',
        },
      });

      logger.debug(
        `Found ${skippedImports.length} skipped imports for job: ${jobId}`,
        {
          context,
          data: { count: skippedImports.length },
        },
      );

      return {
        success: true,
        skippedImports,
      };
    } catch (error) {
      logger.error('Error getting skipped imports', error, {
        context,
        data: { jobId },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
