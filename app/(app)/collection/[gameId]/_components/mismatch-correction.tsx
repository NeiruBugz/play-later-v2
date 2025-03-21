'use client';

import {
  Button,
  useDisclosure,
  VStack,
  Text,
  HStack,
  Box,
  Dialog,
  Portal,
  CloseButton,
} from '@chakra-ui/react';
import { IoWarningOutline } from 'react-icons/io5';
import { useDebounceValue } from 'usehooks-ts';
import { toaster } from '@/shared/components/ui/toaster';
import { GameSearch } from '@/features/add-game-to-library/components/game-search';
import { useRef, useState, useEffect } from 'react';
import type { SearchResponse } from '@/shared/types/igdb.types';
import { useGetSuggestions } from '@/features/add-game-to-library/hooks/use-get-suggestions';
import { useCorrectMismatch } from '@/app/(app)/collection/[gameId]/_hooks/use-correct-mismatch';

interface MismatchCorrectionProps {
  gameId: string;
  steamAppId: number | null;
  steamTitle: string;
  currentTitle: string;
}

export function MismatchCorrection({
  gameId,
  steamAppId,
  steamTitle,
  currentTitle,
}: MismatchCorrectionProps) {
  const disclosure = useDisclosure();
  const [searchQuery, setSearchQuery] = useState(currentTitle);
  const [debouncedQuery] = useDebounceValue(searchQuery, 300);
  const isGameSelected = useRef(false);
  const [selectedGame, setSelectedGame] = useState<SearchResponse | null>(null);

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      isGameSelected.current = false;
      setSelectedGame(null);
    }
  }, [debouncedQuery]);

  const onMismatchCorrected = () => {
    disclosure.onClose();
    isGameSelected.current = false;
    setSelectedGame(null);
    setSearchQuery('');
  };

  const {
    data: searchResults = [],
    isLoading: isSearching,
    error: searchError,
  } = useGetSuggestions({
    searchQuery: debouncedQuery,
    isEnabled: debouncedQuery.length >= 3 && !isGameSelected.current,
  });

  const { mutate: submitCorrection, isPending: isSubmitting } =
    useCorrectMismatch({ onSuccessCallback: onMismatchCorrected });

  const handleCorrection = async (game: SearchResponse) => {
    if (!steamAppId) {
      toaster.create({
        title: 'Cannot correct match',
        description: 'No Steam App ID available for this game.',
        type: 'error',
      });
      return;
    }

    submitCorrection({
      gameId,
      steamAppId,
      steamTitle,
      newIgdbId: game.id,
      newIgdbTitle: game.name,
    });
  };

  return (
    <>
      <Dialog.Root open={disclosure.open} onOpenChange={disclosure.onOpen}>
        <Dialog.Trigger asChild>
          <Button size="sm" colorPalette="orange" variant="outline">
            <HStack>
              <IoWarningOutline />
              <Text>Fix import mismatch</Text>
            </HStack>
          </Button>
        </Dialog.Trigger>

        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Correct Game Match</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body pb={6}>
                <VStack gap={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold">Current Match:</Text>
                    <Text>{currentTitle}</Text>
                  </Box>

                  <Box>
                    <Text fontWeight="bold">Steam Game:</Text>
                    <Text>{steamTitle}</Text>
                    {steamAppId && (
                      <Text fontSize="sm" color="gray.500">
                        Steam App ID: {steamAppId}
                      </Text>
                    )}
                  </Box>

                  <GameSearch
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setSelectedGame={setSelectedGame}
                    isGameSelected={isGameSelected}
                    isFetchingSuggestions={isSearching}
                    isFetchingGameData={isSubmitting}
                    suggestions={searchResults}
                    selectedGame={selectedGame}
                  />

                  {searchError && (
                    <Box color="red.500">
                      <Text>Failed to search games. Please try again.</Text>
                    </Box>
                  )}

                  {selectedGame && (
                    <Button
                      colorPalette="blue"
                      onClick={() => handleCorrection(selectedGame)}
                      disabled={isSubmitting}
                      loading={isSubmitting}
                    >
                      Confirm Correction
                    </Button>
                  )}
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
