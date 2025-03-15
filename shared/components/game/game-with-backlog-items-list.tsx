import { Box, Flex } from '@chakra-ui/react';
import { GameWithBacklogItems } from '@/shared/types/backlog.types';
import { GameCard } from './game-card';

export function GameWithBacklogItemsList(props: {
  collection: GameWithBacklogItems[];
}) {
  return (
    <Box>
      <Flex
        gap={4}
        justify="center"
        flexWrap="wrap"
        my={4}
        mx="auto"
        maxW="1200px"
      >
        {props.collection.map((gameWithBacklog) => (
          <GameCard game={gameWithBacklog.game} key={gameWithBacklog.game.id} />
        ))}
      </Flex>
    </Box>
  );
}
