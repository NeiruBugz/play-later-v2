'use client';

import { useState } from 'react';
import { Button, HStack } from '@chakra-ui/react';
import { FiDownload, FiPlus } from 'react-icons/fi';
import { useBulkImport } from '../hooks/use-bulk-import';
import { toaster } from '@/shared/components/ui/toaster';
import { Tooltip } from '@/shared/components/ui/tooltip';

interface BulkImportButtonProps {
  /** The Steam ID to import games from */
  steamId: string;
  /** Callback function called when an import job is started, with the job ID */
  onImportStarted?: (jobId: string) => void;
  /** Whether the import buttons should be disabled */
  disabled?: boolean;
}

/**
 * BulkImportButton Component
 *
 * Provides buttons for importing games from Steam:
 * - "Import New Only" button: Imports only games that aren't already in the user's backlog
 * - "Import All" button: Imports all games from the user's Steam library
 *
 * Both buttons include tooltips explaining their functionality and handle loading states.
 *
 * @param props Component props
 * @returns React component
 */
export function BulkImportButton({
  steamId,
  onImportStarted,
  disabled = false,
}: BulkImportButtonProps) {
  const { startImport, isImporting } = useBulkImport();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles the import process when a button is clicked
   *
   * @param newOnly Whether to import only new games (true) or all games (false)
   */
  const handleImport = async (newOnly: boolean) => {
    if (!steamId.trim()) {
      toaster.create({
        title: 'Steam ID required',
        description: 'Please enter your Steam ID to import games',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const jobId = await startImport(steamId, newOnly);
      toaster.create({
        title: 'Import started',
        description: `Your games are being imported in the background${newOnly ? ' (new games only)' : ''}`,
        type: 'success',
        duration: 5000,
      });

      if (onImportStarted && jobId) {
        onImportStarted(jobId);
      }
    } catch (error) {
      toaster.create({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HStack gap={2}>
      <Tooltip
        content="Import only games that aren't already in your backlog"
        positioning={{ placement: 'top' }}
        showArrow
      >
        <Button
          colorPalette="blue"
          variant="outline"
          onClick={() => handleImport(true)}
          loading={isLoading || isImporting}
          loadingText="Starting import..."
          disabled={disabled || isLoading || isImporting || !steamId.trim()}
          size="sm"
        >
          <FiPlus style={{ marginRight: '8px' }} />
          Import New Only
        </Button>
      </Tooltip>
      <Tooltip
        content="Import all games from your Steam library"
        positioning={{ placement: 'top' }}
        showArrow
      >
        <Button
          colorPalette="blue"
          onClick={() => handleImport(false)}
          loading={isLoading || isImporting}
          loadingText="Starting import..."
          disabled={disabled || isLoading || isImporting || !steamId.trim()}
          size="sm"
        >
          <FiDownload style={{ marginRight: '8px' }} />
          Import All
        </Button>
      </Tooltip>
    </HStack>
  );
}
