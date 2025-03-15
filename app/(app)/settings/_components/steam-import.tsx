'use client';

import { useState, useRef, useEffect } from 'react';
import { toaster } from '@/shared/components/ui/toaster';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  Alert,
  Input,
  Tabs,
} from '@chakra-ui/react';
import { SteamIdInput } from '@/features/import-steam-games/components/steam-id-input';
import { SortDirection, SortField } from '@/features/import-steam-games/types';
import { GamesTable } from '@/features/import-steam-games/components/games-table/table';
import { Pagination } from '@/features/import-steam-games/components/games-table/pagination';
import { useGetSteamGames } from '@/features/import-steam-games/hooks/use-get-steam-games';
import { Skeleton, SkeletonText } from '@/shared/components/ui/skeleton';
import { FiSearch } from 'react-icons/fi';
import { InputGroup } from '@/shared/components/ui/input-group';
import { useDebounceValue } from 'usehooks-ts';
import { BulkImportButton } from '@/features/import-steam-games/components/bulk-import-button';
import { ImportHistory } from '@/features/import-steam-games/components/import-history';
import { ImportProgress } from '@/features/import-steam-games/components/import-progress';

// Error Message Component
function ErrorMessage({ error }: { error: unknown }) {
  return (
    <Alert.Root status="error" mt="4" borderRadius="md" p="4">
      <Alert.Content>
        <Flex direction="column">
          <Alert.Title>
            <Text fontWeight="bold">Error loading games:</Text>
          </Alert.Title>
          <Alert.Description>
            <Text>
              {error instanceof Error ? error.message : 'Unknown error'}
            </Text>
          </Alert.Description>
        </Flex>
      </Alert.Content>
    </Alert.Root>
  );
}

// Games Skeleton Component
function GamesSkeleton() {
  return (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden">
      <Box overflowX="auto">
        <Box as="table" width="full">
          {/* Skeleton Header */}
          <Box as="thead">
            <Box as="tr">
              <Box as="th" p="3" textAlign="left">
                <Skeleton height="20px" width="100px" />
              </Box>
              <Box as="th" p="3" textAlign="left">
                <Skeleton height="20px" width="80px" />
              </Box>
              <Box as="th" p="3" textAlign="left">
                <Skeleton height="20px" width="80px" />
              </Box>
            </Box>
          </Box>

          {/* Skeleton Rows */}
          <Box as="tbody">
            {Array.from({ length: 10 }).map((_, index) => (
              <Box as="tr" key={index}>
                <Box as="td" p="3">
                  <Flex align="center" gap="3">
                    <Skeleton width="40px" height="40px" borderRadius="md" />
                    <SkeletonText noOfLines={1} width="150px" />
                  </Flex>
                </Box>
                <Box as="td" p="3">
                  <Skeleton height="20px" width="60px" />
                </Box>
                <Box as="td" p="3">
                  <Skeleton height="20px" width="100px" />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function SteamImport() {
  const [steamId, setSteamId] = useState('');
  const [page, setPage] = useState(1);
  const [showGameList, setShowGameList] = useState(false);
  const [sortField, setSortField] = useState<SortField>('playtime_forever');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);
  const [currentImportJobId, setCurrentImportJobId] = useState<string | null>(
    null,
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 20;

  // Regular query for paginated games
  const gamesQuery = useGetSteamGames({
    steamId,
    page,
    pageSize,
    showGameList,
    sortField,
    sortDirection,
  });

  // Separate query for searching across all pages
  const searchQuery = useGetSteamGames({
    steamId,
    page: 1,
    pageSize,
    showGameList: showGameList && !!debouncedSearchTerm,
    sortField,
    sortDirection,
    fetchAllPages: true,
  });

  // Determine which query to use based on whether we're searching
  const activeQuery = debouncedSearchTerm ? searchQuery : gamesQuery;

  // Filter games based on search term
  const filteredGames = activeQuery.data?.games
    ? activeQuery.data.games.filter((game) => {
        if (!debouncedSearchTerm) return true;

        // Check if the main game name matches
        if (
          game.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        ) {
          return true;
        }

        // Check if any related games match
        if ('relatedGames' in game && game.relatedGames) {
          return game.relatedGames.some((relatedGame) =>
            relatedGame.name
              .toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()),
          );
        }

        return false;
      })
    : [];

  // Add keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl+F or Cmd+F is pressed and games are loaded
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === 'f' &&
        showGameList &&
        activeQuery.data?.games
      ) {
        e.preventDefault(); // Prevent browser's default search
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGameList, activeQuery.data]);

  const handleShowGameList = () => {
    if (!steamId.trim()) {
      toaster.create({
        title: 'Steam ID required',
        description: 'Please enter your Steam ID to view games',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    setShowGameList(true);
    setPage(1);
    setSearchTerm(''); // Reset search term when viewing games
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
    // Reset to first page when sorting changes
    setPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleImportStarted = (jobId: string) => {
    setCurrentImportJobId(jobId);
  };

  const renderImportContent = () => (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading as="h2" size="md" mb={4}>
          View Your Steam Games
        </Heading>
        <Text mb={4}>Enter your Steam ID to view your games.</Text>

        <SteamIdInput
          steamId={steamId}
          setSteamId={setSteamId}
          onViewGames={handleShowGameList}
          isLoading={gamesQuery.isLoading}
        />
      </Box>

      {showGameList && (
        <Box>
          <Flex
            justify="space-between"
            mb={4}
            wrap="wrap"
            gap={2}
            align="center"
          >
            <Heading as="h3" size="sm">
              Your Steam Games
            </Heading>
            <BulkImportButton
              steamId={steamId}
              onImportStarted={handleImportStarted}
              disabled={activeQuery.isLoading || activeQuery.isError}
            />
          </Flex>

          {currentImportJobId && (
            <Box mb={4} position="relative" zIndex="1">
              <ImportProgress jobId={currentImportJobId} />
            </Box>
          )}

          {/* Always show search input regardless of loading state */}
          <Box mb={4}>
            <Flex gap={2} align="center">
              <Box flex="1">
                <InputGroup
                  w="100%"
                  startElement={<FiSearch color="gray.400" />}
                  endElement={
                    searchTerm ? (
                      <Button
                        p={0}
                        size="xs"
                        onClick={() => setSearchTerm('')}
                        variant="ghost"
                      >
                        ✕
                      </Button>
                    ) : null
                  }
                >
                  <Input
                    ref={searchInputRef}
                    placeholder="Search games... (Ctrl+F)"
                    value={searchTerm}
                    onChange={handleSearch}
                    borderRadius="md"
                    w="100%"
                  />
                </InputGroup>
              </Box>
              {searchTerm && (
                <Button
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  variant="outline"
                  colorPalette="blue"
                >
                  Show All Games
                </Button>
              )}
            </Flex>
            <Text fontSize="xs" color="gray.500" mt={1} ml={1}>
              Search also looks in related games
            </Text>
          </Box>

          {activeQuery.isLoading ? (
            <GamesSkeleton />
          ) : activeQuery.isError ? (
            <ErrorMessage error={activeQuery.error} />
          ) : activeQuery.data?.games && activeQuery.data.games.length > 0 ? (
            <>
              <Box
                mb={4}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                bg="blue.50"
              >
                <Flex align="center" gap={2}>
                  <Text fontWeight="medium">
                    {debouncedSearchTerm ? (
                      <>
                        Showing {filteredGames.length} of{' '}
                        {activeQuery.data.games.length} games matching &ldquo;
                        {debouncedSearchTerm}&rdquo;
                      </>
                    ) : (
                      <>
                        Showing {filteredGames.length} games
                        {activeQuery.data.totalPages > 1 && (
                          <Text as="span" fontStyle="italic">
                            {' '}
                            (page {activeQuery.data.currentPage} of{' '}
                            {activeQuery.data.totalPages})
                          </Text>
                        )}
                      </>
                    )}
                    {activeQuery.data.games.some(
                      (game) => 'relatedGames' in game && game.relatedGames,
                    ) && (
                      <Text as="span" fontStyle="italic">
                        {' '}
                        (related games have been grouped together)
                      </Text>
                    )}
                  </Text>
                </Flex>
              </Box>

              <GamesTable
                games={filteredGames}
                selectedGameIds={[]}
                onSelectGame={() => {}}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              {filteredGames.length === 0 && debouncedSearchTerm && (
                <Box
                  p={6}
                  borderWidth="1px"
                  borderRadius="md"
                  textAlign="center"
                  mt={4}
                >
                  <Text fontSize="lg" mb={3}>
                    No games found matching &ldquo;{debouncedSearchTerm}
                    &rdquo;
                  </Text>
                  <Button
                    onClick={() => setSearchTerm('')}
                    size="sm"
                    colorPalette="blue"
                    variant="outline"
                  >
                    Clear search
                  </Button>
                </Box>
              )}
              {/* Only show pagination when no search term is active */}
              {activeQuery.data.totalPages > 1 && !debouncedSearchTerm && (
                <Pagination
                  currentPage={activeQuery.data.currentPage}
                  totalPages={activeQuery.data.totalPages}
                  onPageChange={(newPage) => {
                    setPage(newPage);
                    setSearchTerm(''); // Reset search when changing pages
                  }}
                  isLoading={activeQuery.isLoading}
                />
              )}
            </>
          ) : (
            <Box p={6} borderWidth="1px" borderRadius="md" textAlign="center">
              <Text fontSize="lg" mb={3}>
                No games found for this Steam ID
              </Text>
              <Text color="gray.500" mb={4}>
                Make sure your Steam profile is public and you have games in
                your library.
              </Text>
              <Button
                onClick={() => setShowGameList(false)}
                size="sm"
                colorPalette="blue"
                variant="outline"
              >
                Try a different Steam ID
              </Button>
            </Box>
          )}
        </Box>
      )}
    </VStack>
  );

  return (
    <Box>
      <Tabs.Root defaultValue="import" variant="line">
        <Tabs.List>
          <Tabs.Trigger value="import">Import Games</Tabs.Trigger>
          <Tabs.Trigger value="history">Import History</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        <Tabs.Content value="import" pt={4}>
          {renderImportContent()}
        </Tabs.Content>

        <Tabs.Content value="history" pt={4}>
          <Box>
            <ImportHistory />
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
