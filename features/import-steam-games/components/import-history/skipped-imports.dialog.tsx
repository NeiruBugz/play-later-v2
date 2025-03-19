import {
  Dialog,
  Badge,
  TableColumnHeader,
  Button,
  TableHeader,
  TableRoot,
  TableRow,
  TableBody,
  TableCell,
  Flex,
  Text,
  Box,
  Input,
} from '@chakra-ui/react';

import { useMemo, useState } from 'react';
import { CloseButton } from '@/shared/components/ui/close-button';

import { useSkippedImports } from '@/features/import-steam-games';
import { formatDistanceToNow } from 'date-fns';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

type SkippedImportsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | null;
};

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

export { SkippedImportsDialog };
