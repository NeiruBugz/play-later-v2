'use client';

import { InputGroup } from '@/components/ui/input-group';
import { addGameToBacklogAction } from '@/server/actions/backlogActions';
import {
  getIGDBGameData,
  searchGamesAction,
} from '@/server/actions/gameActions';
import type { SearchResponse } from '@/shared/types/igdb.types';
import {
  Box,
  Button,
  Input,
  List,
  VStack,
  Field,
  NativeSelectRoot,
  NativeSelectField,
  ProgressCircle,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { parse } from 'date-fns';
import { useSession } from 'next-auth/react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';

function IndeterminateSpinner() {
  return (
    <ProgressCircle.Root size="sm" value={null}>
      <ProgressCircle.Circle css={{ '--thickness': '4px' }}>
        <ProgressCircle.Track />
        <ProgressCircle.Range />
      </ProgressCircle.Circle>
    </ProgressCircle.Root>
  );
}

export function Form() {
  const { data } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');
  const [acquisitionType, setAcquisitionType] = useState('');
  const isGameSelected = useRef(false);
  const [debouncedQuery] = useDebounceValue(searchQuery, 300);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);

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

  const handleSearchChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const term = event.currentTarget.value;
    setSearchQuery(term);
  };

  const handleGameSelect = (game: SearchResponse) => {
    setSelectedGame(game);
    setSearchQuery(game.name);
    isGameSelected.current = true;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleGameSelect(suggestions[highlightedIndex]);
      }
    }
  };

  const handleSubmit = async () => {
    if (
      !selectedGame ||
      !status ||
      !platform ||
      !acquisitionType ||
      !data?.user?.id
    )
      return;

    try {
      const parsedDate = selectedGame.release_dates?.[0].human
        ? parse(
            selectedGame.release_dates?.[0].human,
            'MMM dd, yyyy',
            new Date(),
          )
        : null;
      await addGameToBacklogAction({
        userId: data.user.id,
        igdbGame: {
          igdbId: selectedGame.id,
          name: selectedGame.name,
          coverImage: selectedGame.cover.image_id,
          description: selectedGame.summary || '',
          releaseDate: parsedDate,
          aggregatedRating: igdbFullGameResponse?.aggregated_rating || null,
          screenshots: igdbFullGameResponse?.screenshots,
          genres: igdbFullGameResponse?.genres,
        },
        status,
        platform,
        acquisitionType,
      });
    } catch (error) {
      console.error('Error adding game to backlog:', error);
    } finally {
      setSelectedGame(null);
      setSearchQuery('');
      setStatus('');
      setPlatform('');
      setAcquisitionType('');
      isGameSelected.current = false;
    }
  };

  return (
    <Box>
      <Field.Root mb={4} position="relative">
        <Field.Label>Search Game</Field.Label>
        <InputGroup
          width="full"
          flex="1"
          endElement={
            isFetchingSuggestions || isFetchingGameData ? (
              <IndeterminateSpinner />
            ) : null
          }
        >
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Type game name..."
            position="relative"
            onKeyDown={handleKeyDown}
          />
        </InputGroup>
        {suggestions
          ? suggestions.length > 0 &&
            !isGameSelected.current && (
              <List.Root
                border="1px"
                borderColor="gray.200"
                borderRadius="md"
                mt={2}
                w="full"
                position="absolute"
                bg="white"
                zIndex={10}
                top="60px"
                shadow="md"
                maxH="260px"
                overflowY="scroll"
              >
                {suggestions?.map((game, index) => (
                  <List.Item
                    w="full"
                    key={game.id}
                    listStyle="none"
                    p={2}
                    onClick={() => handleGameSelect(game)}
                    bg={index === highlightedIndex ? 'gray.200' : 'white'}
                    _hover={{ background: 'gray.100', cursor: 'pointer' }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    ref={(el) => {
                      if (el) {
                        suggestionRefs.current[index] = el;
                      }
                    }}
                  >
                    {game.name} ({game.release_dates?.[0].human.slice(-4)})
                  </List.Item>
                ))}
              </List.Root>
            )
          : null}
      </Field.Root>

      <VStack spaceY={4}>
        <Field.Root>
          <Field.Label>Status</Field.Label>
          <NativeSelectRoot>
            <NativeSelectField
              placeholder="Select status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="TO_PLAY">Backlog</option>
              <option value="PLAYING">Playing</option>
              <option value="COMPLETED">Completed</option>
              <option value="PLAYED">Played</option>
              <option value="WISHLIST">Wishlist</option>
            </NativeSelectField>
          </NativeSelectRoot>
        </Field.Root>
        <Field.Root>
          <Field.Label>Platform</Field.Label>
          <NativeSelectRoot>
            <NativeSelectField
              placeholder="Select platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="pc">PC</option>
              <option value="xbox">Xbox</option>
              <option value="playstation">PlayStation</option>
            </NativeSelectField>
          </NativeSelectRoot>
        </Field.Root>
        <Field.Root>
          <Field.Root>Acquisition Type</Field.Root>
          <NativeSelectRoot>
            <NativeSelectField
              placeholder="Select acquisition type"
              value={acquisitionType}
              onChange={(e) => setAcquisitionType(e.target.value)}
            >
              <option value="DIGITAL">Digital</option>
              <option value="PHYSICAL">Physical</option>
              <option value="SUBSCRIPTION">Subscription</option>
            </NativeSelectField>
          </NativeSelectRoot>
        </Field.Root>
        <Button colorScheme="blue" onClick={handleSubmit} alignSelf="start">
          Add Game
        </Button>
      </VStack>
    </Box>
  );
}
