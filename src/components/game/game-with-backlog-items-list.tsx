import { Box, HStack } from '@chakra-ui/react';
import { GameWithBacklogItems } from '@/shared/types/backlog.types';
import { GameCard } from '@/components/game/game-card';

export function GameWithBacklogItemsList(props: {
  collection: GameWithBacklogItems[];
}) {
  return (
    <Box>
      <HStack gap={2} justify="center" flexWrap="wrap" my={2}>
        {props.collection.map((gameWithBacklog) => (
          <GameCard game={gameWithBacklog.game} key={gameWithBacklog.game.id} />
        ))}
      </HStack>
    </Box>
  );
}
