import {
  Card,
  Heading,
  Text,
  VStack,
  Flex,
  Box,
  Image,
} from '@chakra-ui/react';
import { prisma } from '@/prisma/client';
import { IMAGE_API, IMAGE_SIZES } from '@/shared/config/igdb.image.config';

export default async function ComingSoonWidget({
  userId,
}: {
  userId?: string;
}) {
  // Get upcoming games from wishlist (games with status WISHLIST and release date in the future)
  const upcomingGames = await prisma.game.findMany({
    where: {
      backlogItems: {
        some: {
          userId,
          status: 'WISHLIST',
        },
      },
      releaseDate: {
        gt: new Date(),
      },
    },
    orderBy: {
      releaseDate: 'asc',
    },
    take: 3,
  });

  return (
    <Card.Root p={4} height="full">
      <Heading size="md" mb={4}>
        Coming Soon
      </Heading>

      {upcomingGames.length === 0 ? (
        <Flex
          justify="center"
          align="center"
          height="150px"
          direction="column"
          gap={2}
        >
          <Text color="gray.500">No upcoming games in your wishlist</Text>
          <Text fontSize="sm" color="gray.400">
            Add games to your wishlist to track releases
          </Text>
        </Flex>
      ) : (
        <VStack gap={3} align="stretch">
          {upcomingGames.map((game) => (
            <Flex key={game.id} gap={3}>
              <Box minWidth="50px" height="75px" position="relative">
                {game.coverImage ? (
                  <Image
                    src={`${IMAGE_API}/${IMAGE_SIZES['c-sm']}/${game.coverImage}.jpg`}
                    alt={game.title}
                    borderRadius="md"
                    objectFit="cover"
                    width="100%"
                    height="100%"
                  />
                ) : (
                  <Box
                    bg="gray.700"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    width="100%"
                    height="100%"
                  >
                    <Text fontSize="xs" color="gray.500">
                      No image
                    </Text>
                  </Box>
                )}
              </Box>
              <Box>
                <Text fontWeight="semibold" fontSize="sm" maxLines={1}>
                  {game.title}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {game.releaseDate
                    ? formatDate(game.releaseDate)
                    : 'Release date unknown'}
                </Text>
              </Box>
            </Flex>
          ))}
        </VStack>
      )}
    </Card.Root>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
