'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Progress,
  Flex,
  Badge,
  Drawer,
  useDisclosure,
} from '@chakra-ui/react';
import { useImportJobs, useImportJobStatus } from '../hooks/use-bulk-import';
import { ImportProgress } from './import-progress';

export function GlobalImportStatus() {
  const { data: jobs } = useImportJobs();
  const { open, onOpen, onClose } = useDisclosure();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Find the most recent active job
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      const activeJob = jobs.find(
        (job: { status: string; id: string }) =>
          job.status === 'PENDING' || job.status === 'PROCESSING',
      );

      if (activeJob) {
        setActiveJobId(activeJob.id);
      } else {
        setActiveJobId(null);
      }
    }
  }, [jobs]);

  // If no active job, don't show anything
  if (!activeJobId) {
    return null;
  }

  return (
    <>
      <Box
        position="fixed"
        bottom="20px"
        right="20px"
        zIndex="1000"
        bg="white"
        boxShadow="md"
        borderRadius="md"
        p={3}
        maxWidth="300px"
        width="100%"
        onClick={onOpen}
        cursor="pointer"
      >
        <ActiveJobIndicator jobId={activeJobId} />
      </Box>

      <Drawer.Root open={open} onOpenChange={onClose} size="md">
        <Drawer.Backdrop />
        <Drawer.Content>
          <Drawer.CloseTrigger />
          <Drawer.Header>Import Status</Drawer.Header>
          <Drawer.Body>
            {activeJobId && <ImportProgress jobId={activeJobId} />}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </>
  );
}

function ActiveJobIndicator({ jobId }: { jobId: string }) {
  const jobQuery = useImportJobStatus(jobId);

  if (jobQuery.isLoading || !jobQuery.data) {
    return (
      <Box>
        <Text fontWeight="medium" mb={1}>
          Steam Import
        </Text>
        <Progress.Root size="sm" colorScheme="blue">
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Box>
    );
  }

  const job = jobQuery.data;
  const progress =
    job.totalGames > 0
      ? Math.round((job.processedGames / job.totalGames) * 100)
      : 0;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={1}>
        <Text fontWeight="medium">Steam Import</Text>
        <Badge colorScheme="blue" variant="subtle">
          {job.status.toLowerCase()}
        </Badge>
      </Flex>
      <Progress.Root
        value={progress}
        size="sm"
        colorScheme="blue"
        striped
        animated
      >
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      <Text fontSize="xs" color="gray.600" mt={1}>
        {job.processedGames} of {job.totalGames} games ({progress}%)
      </Text>
      <Text fontSize="xs" color="gray.500">
        Click for details
      </Text>
    </Box>
  );
}
