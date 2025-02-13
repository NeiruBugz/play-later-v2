import { Game } from '@/domain/entities/Game';
import { IMAGE_API, IMAGE_SIZES } from '@/shared/config/igdb.image.config';
import { Box, Card, HStack, Image as ChakraImage } from '@chakra-ui/react';
import Image from 'next/image';
import Link from 'next/link';
import { GameWithBacklogItems } from '@/domain/repositories/GameRepository';

function GameCard({ game }: { game: Game }) {
  return (
    <Card.Root width="140px" height="fit-content" minH="184px">
      <Link href={`/collection/${game.id}`}>
        {game.coverImage ? (
          <ChakraImage asChild>
            <Image
              src={`${IMAGE_API}/${IMAGE_SIZES['hd']}/${game.coverImage}.webp`}
              alt={`${game.title} cover art`}
              width={140}
              height={210}
            />
          </ChakraImage>
        ) : null}
      </Link>
    </Card.Root>
  );
}

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
