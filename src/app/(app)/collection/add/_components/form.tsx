'use client';

import { addGameToBacklogAction } from '@/server/actions/backlogActions';
import { searchGamesAction } from '@/server/actions/gameActions';
import { SearchResponse } from '@/shared/types/igdb.types';
import {
  Box,
  Button,
  Input,
  List,
  VStack,
  Field,
  NativeSelectRoot,
  NativeSelectField,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ChangeEvent, useRef, useState } from 'react';

export function Form() {
  const { data } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');
  const [acquisitionType, setAcquisitionType] = useState('');
  const isGameSelected = useRef(false);

  const { data: suggestions } = useQuery({
    queryKey: ['search', 'games', searchQuery],
    queryFn: () => searchGamesAction(searchQuery),
    enabled: searchQuery.length >= 3 && isGameSelected.current === false,
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

  console.log({ suggestions });

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
      await addGameToBacklogAction({
        userId: data.user.id,
        igdbGame: {
          igdbId: selectedGame.id,
          name: selectedGame.name,
          coverImage: selectedGame.cover.image_id,
        },
        status,
        platform,
        acquisitionType,
      });

      setSelectedGame(null);
      setSearchQuery('');
      setStatus('');
      setPlatform('');
      setAcquisitionType('');
    } catch (error) {
      console.error('Error adding game to backlog:', error);
    }
  };

  return (
    <Box>
      <Field.Root mb={4} position="relative">
        <Field.Label>Search Game</Field.Label>
        <Input
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Type game name..."
          position="relative"
        />
        {suggestions
          ? suggestions.length > 0 && (
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
                {suggestions?.map((game) => (
                  <List.Item
                    w="full"
                    key={game.id}
                    listStyle="none"
                    p={2}
                    _hover={{ background: 'gray.100', cursor: 'pointer' }}
                    onClick={() => handleGameSelect(game)}
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
