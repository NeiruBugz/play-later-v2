'use client';

import { useState } from 'react';
import { Button, HStack } from '@chakra-ui/react';
import { FiDownload, FiPlus } from 'react-icons/fi';
import { useBulkImport } from '../hooks/use-bulk-import';
import { toaster } from '@/shared/components/ui/toaster';
import { Tooltip } from '@/shared/components/ui/tooltip';

interface BulkImportButtonProps {
  steamId: string;
  onImportStarted?: (jobId: string) => void;
  disabled?: boolean;
}

export function BulkImportButton({
  steamId,
  onImportStarted,
  disabled = false,
}: BulkImportButtonProps) {
  const { startImport, isImporting } = useBulkImport();
  const [isLoading, setIsLoading] = useState(false);

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
          colorScheme="blue"
          variant="outline"
          onClick={() => handleImport(true)}
          loading={isLoading || isImporting}
          loadingText="Starting import..."
          disabled={disabled || isLoading || isImporting || !steamId.trim()}
          size="sm"
        >
          <FiPlus />
          Import New Only
        </Button>
      </Tooltip>
      <Tooltip
        content="Import all games from your Steam library"
        positioning={{ placement: 'top' }}
        showArrow
      >
        <Button
          colorScheme="blue"
          onClick={() => handleImport(false)}
          loading={isLoading || isImporting}
          loadingText="Starting import..."
          disabled={disabled || isLoading || isImporting || !steamId.trim()}
          size="sm"
        >
          <FiDownload />
          Import All
        </Button>
      </Tooltip>
    </HStack>
  );
}
