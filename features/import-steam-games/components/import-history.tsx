'use client';

import { useState } from 'react';
import { useImportJobs, useFailedImports } from '../hooks/use-bulk-import';
import {
  Box,
  Text,
  Flex,
  Badge,
  Button,
  Dialog,
  CloseButton,
} from '@chakra-ui/react';
import {
  AccordionRoot,
  AccordionItem,
  AccordionItemTrigger,
  AccordionItemContent,
} from '@/shared/components/ui/accordion';
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableColumnHeader,
} from '@/shared/components/ui/table';
import { formatDistanceToNow, format } from 'date-fns';
import { ImportProgress } from './import-progress';

/**
 * ImportHistory Component
 *
 * Displays a history of all Steam import jobs for the current user.
 * Each job is displayed in an accordion with details about the import process.
 * Users can view detailed information about failed imports for each job.
 *
 * @returns React component
 */
export function ImportHistory() {
  const { data: jobs, isLoading, isError } = useImportJobs();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    setIsDialogOpen(true);
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

              {job.failedGames && job.failedGames > 0 && (
                <Button
                  size="sm"
                  colorPalette="red"
                  variant="outline"
                  mt={3}
                  onClick={() => handleViewFailures(job.id)}
                >
                  View Failed Imports ({job.failedGames})
                </Button>
              )}
            </AccordionItemContent>
          </AccordionItem>
        ))}
      </AccordionRoot>

      <FailedImportsDialog
        open={isDialogOpen}
        onOpenChange={(open) => setIsDialogOpen(open)}
        jobId={selectedJobId}
      />
    </Box>
  );
}

/**
 * StatusBadge Component
 *
 * Displays a colored badge representing the current status of an import job
 *
 * @param props Component props containing the status string
 * @returns React component
 */
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
      colorPalette={color}
      textTransform="uppercase"
      variant="subtle"
      px={2}
      py={0.5}
      borderRadius="full"
    >
      {status.toLowerCase()}
    </Badge>
  );
}

interface FailedImportsDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback for when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** The ID of the import job to show failed imports for */
  jobId: string | null;
}

/**
 * FailedImportsDialog Component
 *
 * Displays a modal dialog with a table of failed imports for a specific job.
 * Shows details about each failed import including the game name, reason for failure,
 * and when the import was attempted.
 *
 * @param props Component props
 * @returns React component
 */
function FailedImportsDialog({
  open,
  onOpenChange,
  jobId,
}: FailedImportsDialogProps) {
  const { data: failedImports, isLoading } = useFailedImports(jobId);

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxWidth="800px" width="90vw" mx="auto" my="10vh">
          <Dialog.CloseTrigger />
          <Dialog.Header>
            <Dialog.Title>Failed Imports</Dialog.Title>
          </Dialog.Header>

          <Dialog.Body>
            {isLoading ? (
              <Text>Loading failed imports...</Text>
            ) : !failedImports || failedImports.length === 0 ? (
              <Text>No failed imports found</Text>
            ) : (
              <Box overflowX="auto">
                <TableRoot size="sm" variant="line">
                  <TableHeader>
                    <TableRow>
                      <TableColumnHeader>Game</TableColumnHeader>
                      <TableColumnHeader>Reason</TableColumnHeader>
                      <TableColumnHeader>Date</TableColumnHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedImports.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Text fontWeight="medium">{item.gameName}</Text>
                          <Text fontSize="xs" color="gray.500">
                            Steam App ID: {item.steamAppId}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Text>{item.reason}</Text>
                          {item.errorMessage && (
                            <Text fontSize="xs" color="red.500">
                              {item.errorMessage.includes(
                                'IGDB entry not found',
                              )
                                ? item.errorMessage
                                : 'System error occurred during import'}
                            </Text>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.attemptedAt
                            ? formatDistanceToNow(new Date(item.attemptedAt), {
                                addSuffix: true,
                              })
                            : 'Unknown'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableRoot>
              </Box>
            )}
          </Dialog.Body>

          <Dialog.Footer>
            <Dialog.ActionTrigger asChild>
              <Button colorPalette="blue">Close</Button>
            </Dialog.ActionTrigger>
          </Dialog.Footer>
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" position="absolute" top={3} right={3} />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
