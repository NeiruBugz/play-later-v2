'use server';
import { auth } from '@/auth';
import { processBulkImport } from '@/features/import-steam-games/actions/process-bulk-import';
import { prisma } from '@/prisma/client';
import { logger } from '@/shared/lib/logger';
import { nextSafeActionClient } from '@/shared/lib/next-safe-action-client';
import { z } from 'zod';

// Schema for validating the bulk import input
const bulkImportSchema = z.object({
  steamId: z.string().min(1, 'Steam ID is required'),
  newOnly: z.boolean().optional(),
});

export const startBulkImport = nextSafeActionClient
  .schema(bulkImportSchema)
  .action(async ({ parsedInput }) => {
    const { steamId, newOnly = false } = parsedInput;
    const context = 'startBulkImport';

    try {
      logger.info(
        `Starting bulk import for Steam ID: ${steamId}${newOnly ? ' (new games only)' : ''}`,
        { context },
      );

      // Get the current user
      const session = await auth();
      if (!session?.user?.id) {
        logger.warn('Authentication required for bulk import', { context });
        return {
          success: false,
          error: 'Authentication required',
        };
      }

      const userId = session.user.id;
      logger.debug(`User authenticated: ${userId}`, { context });

      // Create a new import job
      const importJob = await prisma.steamImportJob.create({
        data: {
          userId,
          steamId,
          status: 'PENDING',
          importNewOnly: newOnly,
        },
      });

      logger.info(
        `Created import job: ${importJob.id}${newOnly ? ' (new games only)' : ''}`,
        {
          context,
          data: { jobId: importJob.id, steamId, newOnly },
        },
      );

      // Start the import process in the background
      // We don't await this to avoid blocking the UI
      processBulkImport(importJob.id).catch((error) => {
        logger.error(
          `Error processing bulk import job ${importJob.id}`,
          error,
          { context, data: { jobId: importJob.id } },
        );
      });

      return {
        success: true,
        jobId: importJob.id,
      };
    } catch (error) {
      logger.error('Error starting bulk import', error, {
        context,
        data: { steamId, newOnly },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
