'use client';

import { useState, useMemo } from 'react';
import {
  useImportJobs,
  useFailedImports,
  useSkippedImports,
} from '../hooks/use-bulk-import';
import {
  Box,
  Text,
  Flex,
  Badge,
  Button,
  Dialog,
  CloseButton,
  Input,
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
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [sortField, setSortField] = useState<
    'gameName' | 'reason' | 'attemptedAt'
  >('attemptedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get unique reasons for the dropdown
  const uniqueReasons = useMemo(() => {
    if (!failedImports) return [];
    const reasons = failedImports.map((item) => item.reason);
    return [...new Set(reasons)].sort();
  }, [failedImports]);

  const filteredImports = useMemo(() => {
    if (!failedImports) return [];

    // First filter
    const filtered = failedImports.filter(
      (item) =>
        item.gameName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (reasonFilter === '' || item.reason === reasonFilter),
    );

    // Then sort
    return [...filtered].sort((a, b) => {
      if (sortField === 'gameName') {
        return sortDirection === 'asc'
          ? a.gameName.localeCompare(b.gameName)
          : b.gameName.localeCompare(a.gameName);
      } else if (sortField === 'reason') {
        return sortDirection === 'asc'
          ? a.reason.localeCompare(b.reason)
          : b.reason.localeCompare(a.reason);
      } else {
        // attemptedAt
        const dateA = new Date(a.attemptedAt).getTime();
        const dateB = new Date(b.attemptedAt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
  }, [failedImports, searchTerm, reasonFilter, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set default direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxWidth="800px" width="90vw" mx="auto" my="10vh">
          <Dialog.Header>
            <Dialog.Title>Failed Imports</Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body>
            {isLoading ? (
              <Text>Loading failed imports...</Text>
            ) : !failedImports || failedImports.length === 0 ? (
              <Text>No failed imports found</Text>
            ) : (
              <>
                <Flex gap={4} mb={4} direction={{ base: 'column', md: 'row' }}>
                  <Box flex="1">
                    <Text fontSize="xs" mb={1} fontWeight="medium">
                      Search
                    </Text>
                    <Flex gap={2} align="center">
                      <Box flex="1">
                        <Input
                          placeholder="Search by game name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          size="sm"
                        />
                      </Box>
                      {searchTerm && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSearchTerm('')}
                        >
                          Clear
                        </Button>
                      )}
                    </Flex>
                  </Box>

                  <Box width={{ base: 'full', md: '200px' }}>
                    <Text fontSize="xs" mb={1} fontWeight="medium">
                      Filter by reason
                    </Text>
                    <select
                      style={{
                        padding: '0.5rem',
                        borderWidth: '1px',
                        borderRadius: '0.375rem',
                        width: '100%',
                        fontSize: '0.875rem',
                      }}
                      value={reasonFilter}
                      onChange={(e) => setReasonFilter(e.target.value)}
                    >
                      <option value="">All reasons</option>
                      {uniqueReasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </Box>
                </Flex>

                {(searchTerm || reasonFilter) && (
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    Found {filteredImports?.length} of {failedImports.length}{' '}
                    games
                    {reasonFilter && (
                      <>
                        {' '}
                        with reason:{' '}
                        <Badge size="sm" ml={1}>
                          {reasonFilter}
                        </Badge>
                      </>
                    )}
                  </Text>
                )}

                <Box overflowX="auto">
                  <TableRoot size="sm" variant="line">
                    <TableHeader>
                      <TableRow>
                        <TableColumnHeader
                          onClick={() => handleSort('gameName')}
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Flex align="center" gap={1}>
                            Game
                            {sortField === 'gameName' &&
                              (sortDirection === 'asc' ? (
                                <FiChevronUp />
                              ) : (
                                <FiChevronDown />
                              ))}
                          </Flex>
                        </TableColumnHeader>
                        <TableColumnHeader
                          onClick={() => handleSort('reason')}
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Flex align="center" gap={1}>
                            Reason
                            {sortField === 'reason' &&
                              (sortDirection === 'asc' ? (
                                <FiChevronUp />
                              ) : (
                                <FiChevronDown />
                              ))}
                          </Flex>
                        </TableColumnHeader>
                        <TableColumnHeader
                          onClick={() => handleSort('attemptedAt')}
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Flex align="center" gap={1}>
                            Date
                            {sortField === 'attemptedAt' &&
                              (sortDirection === 'asc' ? (
                                <FiChevronUp />
                              ) : (
                                <FiChevronDown />
                              ))}
                          </Flex>
                        </TableColumnHeader>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredImports?.map((item) => (
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
                              ? formatDistanceToNow(
                                  new Date(item.attemptedAt),
                                  {
                                    addSuffix: true,
                                  },
                                )
                              : 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableRoot>
                </Box>

                {filteredImports?.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <Text>No games match your filters</Text>
                    <Button
                      size="sm"
                      variant="outline"
                      mt={2}
                      onClick={() => {
                        setSearchTerm('');
                        setReasonFilter('');
                      }}
                    >
                      Clear all filters
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Dialog.Body>

          <Dialog.Footer>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

interface SkippedImportsDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback for when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** The ID of the import job to show skipped imports for */
  jobId: string | null;
}

/**
 * SkippedImportsDialog Component
 *
 * Displays a modal dialog with a table of skipped imports for a specific job.
 * Shows details about each skipped import including the game name, reason for skipping,
 * and when the import was attempted.
 *
 * @param props Component props
 * @returns React component
 */
function SkippedImportsDialog({
  open,
  onOpenChange,
  jobId,
}: SkippedImportsDialogProps) {
  const { data: skippedImports, isLoading } = useSkippedImports(jobId);
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [sortField, setSortField] = useState<
    'gameName' | 'reason' | 'attemptedAt'
  >('attemptedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get unique reasons for the dropdown
  const uniqueReasons = useMemo(() => {
    if (!skippedImports) return [];
    const reasons = skippedImports.map((item) => item.reason);
    return [...new Set(reasons)].sort();
  }, [skippedImports]);

  const filteredImports = useMemo(() => {
    if (!skippedImports) return [];

    // First filter
    const filtered = skippedImports.filter(
      (item) =>
        item.gameName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (reasonFilter === '' || item.reason === reasonFilter),
    );

    // Then sort
    return [...filtered].sort((a, b) => {
      if (sortField === 'gameName') {
        return sortDirection === 'asc'
          ? a.gameName.localeCompare(b.gameName)
          : b.gameName.localeCompare(a.gameName);
      } else if (sortField === 'reason') {
        return sortDirection === 'asc'
          ? a.reason.localeCompare(b.reason)
          : b.reason.localeCompare(a.reason);
      } else {
        // attemptedAt
        const dateA = new Date(a.attemptedAt).getTime();
        const dateB = new Date(b.attemptedAt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
  }, [skippedImports, searchTerm, reasonFilter, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set default direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxWidth="800px" width="90vw" mx="auto" my="10vh">
          <Dialog.Header>
            <Dialog.Title>Skipped Games</Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body>
            {isLoading ? (
              <Text>Loading skipped games...</Text>
            ) : !skippedImports || skippedImports.length === 0 ? (
              <Text>No skipped games found</Text>
            ) : (
              <>
                <Flex gap={4} mb={4} direction={{ base: 'column', md: 'row' }}>
                  <Box flex="1">
                    <Text fontSize="xs" mb={1} fontWeight="medium">
                      Search
                    </Text>
                    <Flex gap={2} align="center">
                      <Box flex="1">
                        <Input
                          placeholder="Search by game name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          size="sm"
                        />
                      </Box>
                      {searchTerm && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSearchTerm('')}
                        >
                          Clear
                        </Button>
                      )}
                    </Flex>
                  </Box>

                  <Box width={{ base: 'full', md: '200px' }}>
                    <Text fontSize="xs" mb={1} fontWeight="medium">
                      Filter by reason
                    </Text>
                    <select
                      style={{
                        padding: '0.5rem',
                        borderWidth: '1px',
                        borderRadius: '0.375rem',
                        width: '100%',
                        fontSize: '0.875rem',
                      }}
                      value={reasonFilter}
                      onChange={(e) => setReasonFilter(e.target.value)}
                    >
                      <option value="">All reasons</option>
                      {uniqueReasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </Box>
                </Flex>

                {(searchTerm || reasonFilter) && (
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    Found {filteredImports?.length} of {skippedImports.length}{' '}
                    games
                    {reasonFilter && (
                      <>
                        {' '}
                        with reason:{' '}
                        <Badge size="sm" ml={1}>
                          {reasonFilter}
                        </Badge>
                      </>
                    )}
                  </Text>
                )}

                <Box overflowX="auto">
                  <TableRoot size="sm" variant="line">
                    <TableHeader>
                      <TableRow>
                        <TableColumnHeader
                          onClick={() => handleSort('gameName')}
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Flex align="center" gap={1}>
                            Game
                            {sortField === 'gameName' &&
                              (sortDirection === 'asc' ? (
                                <FiChevronUp />
                              ) : (
                                <FiChevronDown />
                              ))}
                          </Flex>
                        </TableColumnHeader>
                        <TableColumnHeader
                          onClick={() => handleSort('reason')}
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Flex align="center" gap={1}>
                            Reason
                            {sortField === 'reason' &&
                              (sortDirection === 'asc' ? (
                                <FiChevronUp />
                              ) : (
                                <FiChevronDown />
                              ))}
                          </Flex>
                        </TableColumnHeader>
                        <TableColumnHeader
                          onClick={() => handleSort('attemptedAt')}
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Flex align="center" gap={1}>
                            Date
                            {sortField === 'attemptedAt' &&
                              (sortDirection === 'asc' ? (
                                <FiChevronUp />
                              ) : (
                                <FiChevronDown />
                              ))}
                          </Flex>
                        </TableColumnHeader>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredImports?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Text fontWeight="medium">{item.gameName}</Text>
                            <Text fontSize="xs" color="gray.500">
                              Steam App ID: {item.steamAppId}
                            </Text>
                          </TableCell>
                          <TableCell>
                            <Text>{item.reason}</Text>
                          </TableCell>
                          <TableCell>
                            {item.attemptedAt
                              ? formatDistanceToNow(
                                  new Date(item.attemptedAt),
                                  {
                                    addSuffix: true,
                                  },
                                )
                              : 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableRoot>
                </Box>

                {filteredImports?.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <Text>No games match your filters</Text>
                    <Button
                      size="sm"
                      variant="outline"
                      mt={2}
                      onClick={() => {
                        setSearchTerm('');
                        setReasonFilter('');
                      }}
                    >
                      Clear all filters
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Dialog.Body>

          <Dialog.Footer>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
