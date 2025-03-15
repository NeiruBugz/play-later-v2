import { Game } from '@/shared/types/entities/Game';
import { Card, Image as ChakraImage, Flex } from '@chakra-ui/react';
import Image from 'next/image';
import Link from 'next/link';
import { IMAGE_API, IMAGE_SIZES } from '@/shared/config/igdb.image.config';
import { UpdateBacklogItem } from './update-backlog-item';

export function GameCard({ game }: { game: Game }) {
  return (
    <Card.Root variant="gameCard" className="group">
      <Flex
        position="absolute"
        right="2"
        top="2"
        _groupHover={{ display: 'flex' }}
        display="none"
        gap={1}
      >
        <UpdateBacklogItem backlogItemList={game.backlogItems} />
      </Flex>
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
