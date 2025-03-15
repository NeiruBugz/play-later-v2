'use client';

import { useImportJobStatus } from '../hooks/use-bulk-import';
import {
  Box,
  Text,
  Flex,
  Badge,
  Stat,
  Alert,
  HStack,
  Card,
} from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect } from 'react';

interface ImportProgressProps {
  jobId: string;
}

export function ImportProgress({ jobId }: ImportProgressProps) {
  const jobQuery = useImportJobStatus(jobId);

  // Add global styles for animations
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }
      @keyframes shimmer {
        0% { background-position: 0% 0%; }
        100% { background-position: 200% 0%; }
      }
    `;

    // Add it to the document head
    document.head.appendChild(styleEl);

    // Clean up on unmount
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  if (jobQuery.isLoading) {
    return (
      <Card.Root p={4} borderRadius="md">
        <Text mb={2}>Loading import status...</Text>
        <Box
          h="8px"
          w="100%"
          bg="gray.100"
          borderRadius="full"
          overflow="hidden"
        >
          <Box
            w="30%"
            h="100%"
            bg="blue.500"
            borderRadius="full"
            position="relative"
            _after={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              animation: 'loading 1.5s infinite',
            }}
          />
        </Box>
      </Card.Root>
    );
  }

  if (jobQuery.isError) {
    return (
      <Alert.Root status="error" borderRadius="md">
        <Alert.Content>
          <Text>Error loading import status</Text>
        </Alert.Content>
      </Alert.Root>
    );
  }

  if (!jobQuery.data) {
    return (
      <Alert.Root status="warning" borderRadius="md">
        <Alert.Content>
          <Text>Import job not found</Text>
        </Alert.Content>
      </Alert.Root>
    );
  }

  const job = jobQuery.data;
  const isComplete = job.status === 'COMPLETED' || job.status === 'FAILED';
  const progress =
    job.totalGames > 0
      ? Math.round((job.processedGames / job.totalGames) * 100)
      : 0;

  return (
    <Card.Root p={4} borderRadius="md" boxShadow="sm">
      <HStack gap={2} mb={3} justify="space-between">
        <Flex align="center" gap={2}>
          <Text fontWeight="medium">Steam Import</Text>
          <StatusBadge status={job.status} />
          {job.importNewOnly && (
            <Badge
              colorScheme="blue"
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
      </HStack>

      {!isComplete && (
        <>
          <Box
            h="8px"
            w="100%"
            bg="gray.100"
            borderRadius="full"
            overflow="hidden"
            mb={2}
          >
            <Box
              w={`${progress}%`}
              h="100%"
              bg={job.status === 'PROCESSING' ? 'blue.400' : 'blue.500'}
              borderRadius="full"
              transition="width 0.3s ease-in-out"
              position="relative"
              className={job.status === 'PROCESSING' ? 'processing-bar' : ''}
              _after={
                job.status === 'PROCESSING'
                  ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                      animation: 'shimmer 2s infinite',
                    }
                  : undefined
              }
            />
          </Box>
          <Text fontSize="sm" color="gray.600" mb={3}>
            {job.processedGames} of {job.totalGames} games processed ({progress}
            %)
          </Text>
        </>
      )}

      <Flex gap={4} wrap="wrap">
        {job.importedGames !== null && (
          <Stat.Root>
            <Stat.Label>Imported</Stat.Label>
            <Stat.ValueText>{job.importedGames}</Stat.ValueText>
          </Stat.Root>
        )}
        {job.skippedGames !== null && (
          <Stat.Root>
            <Stat.Label>Skipped</Stat.Label>
            <Stat.ValueText>{job.skippedGames}</Stat.ValueText>
          </Stat.Root>
        )}
        {job.failedGames !== null && job.failedGames > 0 && (
          <Stat.Root>
            <Stat.Label>Failed</Stat.Label>
            <Stat.ValueText color="red.500">{job.failedGames}</Stat.ValueText>
          </Stat.Root>
        )}
      </Flex>

      <Box mt={2}>
        {job.startedAt && (
          <Text fontSize="xs" color="gray.500">
            Started {formatDistanceToNow(new Date(job.startedAt))} ago
          </Text>
        )}
        {job.completedAt && (
          <Text fontSize="xs" color="gray.500">
            Completed {formatDistanceToNow(new Date(job.completedAt))} ago
          </Text>
        )}
      </Box>

      {job.error && (
        <Alert.Root status="error" mt={3} size="sm">
          <Alert.Content>
            <Text fontSize="sm">
              {job.error.includes('IGDB entry not found')
                ? job.error
                : 'An error occurred during the import process'}
            </Text>
          </Alert.Content>
        </Alert.Root>
      )}
    </Card.Root>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color;
  switch (status) {
    case 'PENDING':
      color = 'yellow';
      break;
    case 'PROCESSING':
      color = 'blue';
      break;
    case 'COMPLETED':
      color = 'green';
      break;
    case 'FAILED':
      color = 'red';
      break;
    default:
      color = 'gray';
  }

  return (
    <Badge
      colorScheme={color}
      variant="subtle"
      px={2}
      py={0.5}
      borderRadius="full"
    >
      {status.toLowerCase()}
    </Badge>
  );
}
