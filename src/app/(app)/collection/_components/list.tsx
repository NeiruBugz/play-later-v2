import { Game } from '@/domain/entities/Game';
import { getUserGamesWithGroupedBacklogAction } from '@/server/actions/gameActions';
import { IMAGE_API, IMAGE_SIZES } from '@/shared/config/igdb.image.config';
import { Box, Card, HStack } from '@chakra-ui/react';
import Image from 'next/image';
import { CollectionPagination } from './collection-pagination';

function GameCard({ game }: { game: Game }) {
  return (
    <Card.Root p={4} w="200px" h="300px">
      {game.coverImage ? (
        <Image
          src={`${IMAGE_API}/${IMAGE_SIZES['hd']}/${game.coverImage}.webp`}
          alt={`${game.title} cover art`}
          width={200}
          height={300}
        />
      ) : null}
      <Card.Title>{game.title}</Card.Title>
    </Card.Root>
  );
}

export async function List(props: { params: Record<string, string | number> }) {
  const { params } = props;

  const { collection, count } = await getUserGamesWithGroupedBacklogAction({
    platform: params.platform,
    status: params.status,
    search: params.search,
    page: Number(params.page) || 1,
  });

  return (
    <Box>
      <HStack spaceX={2} alignItems="start">
        {collection.map((gameWithBacklog) => (
          <GameCard game={gameWithBacklog.game} key={gameWithBacklog.game.id} />
        ))}
      </HStack>
      <Box my={1}>
        <CollectionPagination count={count} />
      </Box>
    </Box>
  );
}
