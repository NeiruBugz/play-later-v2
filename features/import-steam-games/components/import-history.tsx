'use client';

import { useState } from 'react';
import { useImportJobs } from '../hooks/use-bulk-import';
import { Box, Text, Flex, Badge, Button } from '@chakra-ui/react';
import {
  AccordionRoot,
  AccordionItem,
  AccordionItemTrigger,
  AccordionItemContent,
} from '@/shared/components/ui/accordion';
import { format } from 'date-fns';
import { ImportProgress } from './import-progress';
import { StatusBadge } from '@/features/import-steam-games/components/import-history/status-badge';
import { FailedImportsDialog } from '@/features/import-steam-games/components/import-history/failed-imports-dialog';
import { SkippedImportsDialog } from '@/features/import-steam-games/components/import-history/skipped-imports.dialog';

export function ImportHistory() {
  const { data: jobs, isLoading, isError } = useImportJobs();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isFailedDialogOpen, setIsFailedDialogOpen] = useState(false);
  const [isSkippedDialogOpen, setIsSkippedDialogOpen] = useState(false);

  if (isLoading) {
    return <Text>Loading import history...</Text>;
  }

  if (isError) {
    return <Text color="red.500">Error loading import history</Text>;
  }

  if (!jobs || jobs.length === 0) {
    return <Text>No import history found</Text>;
  }

  const handleViewFailures = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsFailedDialogOpen(true);
  };

  const handleViewSkipped = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsSkippedDialogOpen(true);
  };

  return (
    <Box>
      <Text fontWeight="medium" mb={3}>
        Recent Imports
      </Text>
      <AccordionRoot collapsible>
        {jobs.map((job) => (
          <AccordionItem key={job.id} value={job.id}>
            <AccordionItemTrigger>
              <Box flex="1" textAlign="left">
                <Flex align="center" gap={2}>
                  <StatusBadge status={job.status} />
                  <Text>
                    {job.createdAt
                      ? format(new Date(job.createdAt), 'MMM d, yyyy h:mm a')
                      : 'Unknown date'}
                  </Text>
                  {job.importNewOnly && (
                    <Badge
                      colorPalette="blue"
                      variant="subtle"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontSize="xs"
                    >
                      New Games Only
                    </Badge>
                  )}
                </Flex>
              </Box>
            </AccordionItemTrigger>
            <AccordionItemContent>
              <ImportProgress jobId={job.id} />

              <Flex gap={2} mt={3}>
                {job.skippedGames && job.skippedGames > 0 && (
                  <Button
                    size="sm"
                    colorPalette="blue"
                    variant="outline"
                    onClick={() => handleViewSkipped(job.id)}
                  >
                    View Skipped Games ({job.skippedGames})
                  </Button>
                )}

                {job.failedGames && job.failedGames > 0 && (
                  <Button
                    size="sm"
                    colorPalette="red"
                    variant="outline"
                    onClick={() => handleViewFailures(job.id)}
                  >
                    View Failed Imports ({job.failedGames})
                  </Button>
                )}
              </Flex>
            </AccordionItemContent>
          </AccordionItem>
        ))}
      </AccordionRoot>

      <FailedImportsDialog
        open={isFailedDialogOpen}
        onOpenChange={(open) => setIsFailedDialogOpen(open)}
        jobId={selectedJobId}
      />

      <SkippedImportsDialog
        open={isSkippedDialogOpen}
        onOpenChange={(open) => setIsSkippedDialogOpen(open)}
        jobId={selectedJobId}
      />
    </Box>
  );
}
