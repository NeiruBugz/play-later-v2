'use client';

import { Box, Button, VStack } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useCallback, useReducer, useRef } from 'react';
import {
  statusCollection,
  platformCollection,
  acquisitionTypeCollection,
} from '@/shared/lib/chakra-collection-helpers';
import { GameSearch } from './game-search';
import { SelectField } from './select-field';
import {
  formReducer,
  initialFormState,
  formActions,
  isFormValid,
} from '../constants/reducer';
import { useGetGameDataFromIGDB } from '@/features/add-game-to-library/hooks/use-get-game-data-from-igdb';
import { useFormSubmission } from '../hooks/use-form-submission';
import { useSearchState } from '../hooks/use-search-state';

export function Form() {
  const { data: session } = useSession();
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  const isGameSelected = useRef(false);
  const { selectedGame, statusValue, platformValue, acquisitionTypeValue } =
    formState;

  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    isFetchingSuggestions,
    handleSelectGame,
  } = useSearchState({
    dispatch,
    isGameSelected,
  });

  const { data: igdbFullGameResponse, isLoading: isFetchingGameData } =
    useGetGameDataFromIGDB({
      gameId: selectedGame?.id,
    });

  const { submitForm } = useFormSubmission({
    formState,
    dispatch,
    igdbFullGameResponse,
  });

  const handleStatusChange = useCallback(
    (value: string[]) => dispatch(formActions.setStatus(value)),
    [dispatch],
  );

  const handlePlatformChange = useCallback(
    (value: string[]) => dispatch(formActions.setPlatform(value)),
    [dispatch],
  );

  const handleAcquisitionTypeChange = useCallback(
    (value: string[]) => dispatch(formActions.setAcquisitionType(value)),
    [dispatch],
  );

  const formValid = isFormValid(formState, session?.user?.id);

  const handleSubmit = useCallback(() => {
    submitForm(formValid);
    setSearchQuery('');
  }, [submitForm, formValid, setSearchQuery]);

  return (
    <Box>
      <GameSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedGame={selectedGame}
        setSelectedGame={handleSelectGame}
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
          onChange={handleStatusChange}
          placeholder="Select status"
          isDisabled={!selectedGame?.id}
        />

        <SelectField
          label="Platform"
          collection={platformCollection}
          value={platformValue}
          onChange={handlePlatformChange}
          placeholder="Select platform"
          isDisabled={!selectedGame?.id}
        />

        <SelectField
          label="Acquisition Type"
          collection={acquisitionTypeCollection}
          value={acquisitionTypeValue}
          onChange={handleAcquisitionTypeChange}
          placeholder="Select acquisition type"
          isDisabled={!selectedGame?.id}
        />

        <Button
          colorPalette="blue"
          onClick={handleSubmit}
          alignSelf="start"
          disabled={!formValid}
        >
          Add Game
        </Button>
      </VStack>
    </Box>
  );
}
