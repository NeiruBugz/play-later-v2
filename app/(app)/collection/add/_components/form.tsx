'use client';

import {
  getIGDBGameData,
  searchGamesAction,
} from '@/shared/external-apis/igdb/igdb-actions';
import type { SearchResponse } from '@/shared/types/igdb.types';
import { Box, Button, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { parse } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { toaster } from '@/shared/components/ui/toaster';
import {
  statusCollection,
  platformCollection,
  acquisitionTypeCollection,
} from '@/shared/lib/chakra-collection-helpers';
import { GameSearch } from './game-search';
import { SelectField } from './select-field';
import { createBacklogItemWithGame } from '@/features/add-game-to-library/actions/create-game-with-backlog-item';

export function Form() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<SearchResponse | null>(null);
  const [statusValue, setStatusValue] = useState<string[]>([]);
  const [platformValue, setPlatformValue] = useState<string[]>([]);
  const [acquisitionTypeValue, setAcquisitionTypeValue] = useState<string[]>(
    [],
  );
  const isGameSelected = useRef(false);
  const [debouncedQuery] = useDebounceValue(searchQuery, 300);

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      isGameSelected.current = false;
      setSelectedGame(null);
    }
  }, [debouncedQuery]);

  const { data: suggestions, isLoading: isFetchingSuggestions } = useQuery({
    queryKey: ['search', 'games', debouncedQuery],
    queryFn: () => searchGamesAction(debouncedQuery),
    enabled: debouncedQuery.length >= 3 && !isGameSelected.current,
  });

  const { data: igdbFullGameResponse, isLoading: isFetchingGameData } =
    useQuery({
      queryKey: ['igdb', 'game', 'get-by-id', selectedGame?.id],
      queryFn: () => getIGDBGameData(selectedGame?.id || 0),
      enabled: Boolean(selectedGame?.id),
    });

  const validateForm = () => {
    if (
      !selectedGame ||
      statusValue.length === 0 ||
      platformValue.length === 0 ||
      acquisitionTypeValue.length === 0 ||
      !session?.user?.id
    ) {
      console.error('Form validation failed');
      return false;
    }
    return true;
  };

  const prepareGameData = () => {
    if (!selectedGame) return null;

    const parsedDate = selectedGame.release_dates?.[0]?.human
      ? parse(selectedGame.release_dates[0].human, 'MMM dd, yyyy', new Date())
      : null;

    return {
      igdbId: selectedGame.id,
      name: selectedGame.name,
      coverImage: selectedGame.cover.image_id,
      description: selectedGame.summary || '',
      releaseDate: parsedDate,
      aggregatedRating: igdbFullGameResponse?.aggregated_rating || null,
      screenshots: igdbFullGameResponse?.screenshots,
      genres: igdbFullGameResponse?.genres,
    };
  };

  const handleSuccess = () => {
    if (!selectedGame) return;

    toaster.create({
      type: 'success',
      title: `Successfully added ${selectedGame.name} to collection`,
    });

    resetForm();
  };

  const handleError = (error: unknown) => {
    console.error('Error adding game to backlog:', error);
    toaster.create({
      title: 'Failed to add a game to collection',
      type: 'error',
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  };

  const resetForm = () => {
    setSelectedGame(null);
    setSearchQuery('');
    setStatusValue([]);
    setPlatformValue([]);
    setAcquisitionTypeValue([]);
    isGameSelected.current = false;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const gameData = prepareGameData();
      if (!gameData) return;

      const result = await createBacklogItemWithGame({
        igdbGame: gameData,
        status: statusValue[0],
        platform: platformValue[0],
        acquisitionType: acquisitionTypeValue[0],
      });

      if (result && typeof result === 'object' && 'error' in result) {
        throw new Error(result.error as string);
      }

      handleSuccess();
    } catch (error) {
      handleError(error);
    }
  };

  const isFormValid =
    selectedGame &&
    statusValue.length > 0 &&
    platformValue.length > 0 &&
    acquisitionTypeValue.length > 0;

  return (
    <Box>
      <GameSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedGame={selectedGame}
        setSelectedGame={setSelectedGame}
        isGameSelected={isGameSelected}
        isFetchingSuggestions={isFetchingSuggestions}
        isFetchingGameData={isFetchingGameData}
        suggestions={suggestions}
      />

      <VStack spaceY={4}>
        <SelectField
          label="Status"
          collection={statusCollection}
          value={statusValue}
          onChange={setStatusValue}
          placeholder="Select status"
        />

        <SelectField
          label="Platform"
          collection={platformCollection}
          value={platformValue}
          onChange={setPlatformValue}
          placeholder="Select platform"
        />

        <SelectField
          label="Acquisition Type"
          collection={acquisitionTypeCollection}
          value={acquisitionTypeValue}
          onChange={setAcquisitionTypeValue}
          placeholder="Select acquisition type"
        />

        <Button
          colorScheme="blue"
          onClick={handleSubmit}
          alignSelf="start"
          disabled={!isFormValid}
        >
          Add Game
        </Button>
      </VStack>
    </Box>
  );
}
