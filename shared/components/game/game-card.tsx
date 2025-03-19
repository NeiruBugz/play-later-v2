import { Game } from '@/shared/types/entities/Game';
import {
  Card,
  Image as ChakraImage,
  Flex,
  Box,
  Text,
  Badge,
} from '@chakra-ui/react';
import Image from 'next/image';
import Link from 'next/link';
import { IMAGE_API, IMAGE_SIZES } from '@/shared/config/igdb.image.config';
import { UpdateBacklogItem } from './update-backlog-item';
import {
  IoLibrarySharp,
  IoPlayOutline,
  IoCheckmarkDoneOutline,
  IoCheckmarkCircleOutline,
  IoGiftOutline,
} from 'react-icons/io5';

export function GameCard({ game }: { game: Game }) {
  const backlogItem =
    game.backlogItems && game.backlogItems.length > 0
      ? game.backlogItems[0]
      : null;

  return (
    <Card.Root
      variant="elevated"
      position="relative"
      overflow="hidden"
      transition="all 0.3s ease"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
      }}
      className="group"
    >
      {' '}
      <Flex
        position="absolute"
        right="2"
        top="2"
        _groupHover={{ display: 'flex' }}
        display="none"
        gap={1}
        zIndex={2}
      >
        <UpdateBacklogItem backlogItemList={game.backlogItems} />
      </Flex>
      <Link href={`/collection/${game.id}`}>
        <Box position="relative" width="148px" height="210px" overflow="hidden">
          {/* Dark gradient overlay for text readability */}
          <Box
            position="absolute"
            bottom={4.5}
            left={0}
            right={0}
            height="100%"
            backgroundGradient="to-t"
            gradientFrom="gray.500"
            gradientTo="transparent"
            zIndex={1}
            opacity={0}
            transition="opacity 0.3s ease"
            _groupHover={{ opacity: 1 }}
          />

          {game.coverImage ? (
            <ChakraImage
              asChild
              _groupHover={{
                transform: 'scale(1.05)',
              }}
            >
              <Image
                src={`${IMAGE_API}/${IMAGE_SIZES['hd']}/${game.coverImage}.webp`}
                alt={`${game.title} cover art`}
                width={140}
                height={210}
                style={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                  transition: 'transform 0.3s ease',
                }}
              />
            </ChakraImage>
          ) : (
            <Box
              width="100%"
              height="100%"
              bg="gray.200"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              No Image
            </Box>
          )}

          {/* Game Title on hover */}
          <Text
            position="absolute"
            bottom="40%"
            left="2"
            right="2"
            color="white"
            fontWeight="bold"
            fontSize="sm"
            zIndex={2}
            opacity={0}
            textAlign="center"
            transition="opacity 0.3s ease"
            _groupHover={{ opacity: 1 }}
            // overflow="hidden"
            // textOverflow="ellipsis"
            // whiteSpace="nowrap"
          >
            {game.title}
          </Text>
        </Box>

        {/* Rating Badge - Always visible */}
        {/* {game.aggregatedRating && (
          <Badge
            position="absolute"
            top="2"
            left="2"
            colorPalette={getRatingColor(game.aggregatedRating)}
            display="flex"
            alignItems="center"
            px={1.5}
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
          >
            <IoStar style={{ marginRight: '2px' }} />
            {Math.round(game.aggregatedRating)}
          </Badge>
        )} */}

        {/* Status Indicator - Bottom of card */}
        {backlogItem && (
          <Badge
            position="absolute"
            bottom="0"
            left="0"
            right="0"
            py={0.5}
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={1}
            borderRadius="0"
            colorPalette={getStatusColor(backlogItem.status)}
            fontSize="xs"
          >
            {getStatusIcon(backlogItem.status)}
            <Text fontSize="xs" fontWeight="medium">
              {getStatusText(backlogItem.status)}
            </Text>
          </Badge>
        )}
      </Link>
    </Card.Root>
  );
}

// function getRatingColor(rating: number): string {
//   if (rating >= 85) return 'green';
//   if (rating >= 70) return 'blue';
//   if (rating >= 50) return 'yellow';
//   return 'red';
// }

function getStatusColor(status: string): string {
  switch (status) {
    case 'PLAYING':
      return 'green';
    case 'COMPLETED':
      return 'blue';
    case 'PLAYED':
      return 'purple';
    case 'TO_PLAY':
      return 'gray';
    default:
      return 'gray';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'PLAYING':
      return 'Playing';
    case 'COMPLETED':
      return 'Completed';
    case 'PLAYED':
      return 'Played';
    case 'TO_PLAY':
      return 'In Backlog';
    case 'WISHLIST':
      return 'Wishlist';
    default:
      return 'Unknown';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PLAYING':
      return <IoPlayOutline />;
    case 'COMPLETED':
      return <IoCheckmarkDoneOutline />;
    case 'PLAYED':
      return <IoCheckmarkCircleOutline />;
    case 'TO_PLAY':
      return <IoLibrarySharp />;
    case 'WISHLIST':
      return <IoGiftOutline />;
    default:
      return null;
  }
}
