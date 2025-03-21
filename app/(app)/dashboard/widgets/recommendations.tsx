import {
  Card,
  Heading,
  Text,
  VStack,
  Flex,
  Box,
  Image,
  Button,
} from '@chakra-ui/react';
import { prisma } from '@/prisma/client';
import { IMAGE_API, IMAGE_SIZES } from '@/shared/config/igdb.image.config';
import Link from 'next/link';
import { IoPlayOutline } from 'react-icons/io5';

export default async function RecommendationsWidget({
  userId,
}: {
  userId?: string;
}) {
  // Get user's games with "TO_PLAY" status
  const toPlayGames = await prisma.game.findMany({
    where: {
      backlogItems: {
        some: {
          userId,
          status: 'TO_PLAY',
        },
      },
    },
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
      // Include backlog items to show in UI
      backlogItems: {
        where: {
          userId,
        },
      },
    },
    take: 20, // Get enough to select from
  });

  // Get user's completed games to analyze preferences
  const completedGames = await prisma.game.findMany({
    where: {
      backlogItems: {
        some: {
          userId,
          status: 'COMPLETED',
        },
      },
    },
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
      reviews: {
        where: {
          userId,
        },
      },
    },
  });

  // Simple recommendation algorithm:
  // 1. Find genres user enjoys (from completed games with high ratings)
  // 2. Find games in backlog with those genres
  // 3. Prioritize games with multiple matching genres

  // Get preferred genres based on completed games with positive ratings
  const genrePreferences = new Map<number, number>();

  completedGames.forEach((game) => {
    const rating = game.reviews?.[0]?.rating || 7; // Default to 7 if no rating
    if (rating >= 7) {
      // Consider games rated 7+ as "liked"
      game.genres.forEach(({ genre }) => {
        const currentScore = genrePreferences.get(genre.id) || 0;
        genrePreferences.set(genre.id, currentScore + (rating - 6)); // Weight by rating
      });
    }
  });

  // Calculate a "recommendation score" for each game
  const gamesWithScores = toPlayGames.map((game) => {
    let score = 0;

    // Add points for matching preferred genres
    game.genres.forEach(({ genre }) => {
      score += genrePreferences.get(genre.id) || 0;
    });

    // Add points for time to complete (shorter games get priority)
    if (game.mainStory && game.mainStory < 10) {
      score += 3;
    } else if (game.mainStory && game.mainStory < 20) {
      score += 1;
    }

    // Add points for highly rated games
    if (game.aggregatedRating && game.aggregatedRating > 85) {
      score += 2;
    } else if (game.aggregatedRating && game.aggregatedRating > 75) {
      score += 1;
    }

    return {
      ...game,
      recommendationScore: score,
    };
  });

  // Get top 3 recommendations
  const recommendations = gamesWithScores
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 3);

  return (
    <Card.Root p={4} height="full">
      <Heading size="md" mb={4}>
        Recommended Next
      </Heading>

      {recommendations.length === 0 ? (
        <Flex
          justify="center"
          align="center"
          height="150px"
          direction="column"
          gap={2}
        >
          <Text color="gray.500">No games to recommend</Text>
          <Text fontSize="sm" color="gray.400">
            Add more games to your collection to get recommendations
          </Text>
        </Flex>
      ) : (
        <VStack gap={3} align="stretch">
          {recommendations.map((game) => (
            <Flex key={game.id} gap={3}>
              <Box minWidth="40px" height="60px" position="relative">
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
              <Box flex="1">
                <Text fontWeight="semibold" fontSize="sm" maxLines={1}>
                  {game.title}
                </Text>
                <Flex justify="space-between" align="center">
                  <Text fontSize="xs" color="gray.500">
                    {game.mainStory ? `~${game.mainStory}h` : 'Time unknown'}
                  </Text>
                  <Link href={`/collection/${game.id}`}>
                    <Button size="xs" colorPalette="green" variant="ghost">
                      <IoPlayOutline />
                      Play
                    </Button>
                  </Link>
                </Flex>
              </Box>
            </Flex>
          ))}
        </VStack>
      )}
    </Card.Root>
  );
}
