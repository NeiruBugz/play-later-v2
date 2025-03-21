import { IndeterminateSpinner } from '../../../shared/components/ui/indereminate-spinner';
import { InputGroup } from '../../../shared/components/ui/input-group';
import { SearchResponse } from '@/shared/types/igdb.types';
import { Field, Input, List, HStack, Image, Text, Box } from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

type GameSearchProps = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setSelectedGame: (game: SearchResponse | null) => void;
  isGameSelected: React.MutableRefObject<boolean>;
  isFetchingSuggestions: boolean;
  isFetchingGameData: boolean;
  suggestions: SearchResponse[] | undefined;
  selectedGame: SearchResponse | null;
};

function GameSearch({
  searchQuery,
  setSearchQuery,
  setSelectedGame,
  isGameSelected,
  isFetchingSuggestions,
  isFetchingGameData,
  suggestions,
}: GameSearchProps) {
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

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
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

  return (
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
                  <HStack gap={3} alignItems="flex-start">
                    {game.cover?.image_id && (
                      <Image
                        src={`https://images.igdb.com/igdb/image/upload/t_cover_small/${game.cover.image_id}.jpg`}
                        alt={game.name}
                        boxSize="50px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <Box flex="1">
                      <Text fontWeight="medium">{game.name}</Text>
                      <Box marginTop={1}>
                        <Text fontSize="sm" color="gray.600" display="inline">
                          {game.release_dates?.[0]?.human?.slice(-4) || 'TBA'}
                        </Text>
                        {game.release_dates &&
                          game.release_dates.length > 0 && (
                            <Text
                              fontSize="sm"
                              color="gray.500"
                              display="inline"
                              mx={2}
                            >
                              •
                            </Text>
                          )}
                        {game.release_dates && (
                          <Text fontSize="sm" color="gray.600" display="inline">
                            {game.release_dates
                              .map((date) => date.platform.name)
                              .join(', ')}
                          </Text>
                        )}
                      </Box>
                    </Box>
                  </HStack>
                </List.Item>
              ))}
            </List.Root>
          )
        : null}
    </Field.Root>
  );
}

export { GameSearch };
