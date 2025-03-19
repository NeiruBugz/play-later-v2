import { prisma } from '@/prisma/client';
import { Card, Heading, Text, VStack, Flex, Separator } from '@chakra-ui/react';

export default async function CollectionStatsWidget({
  userId,
}: {
  userId?: string;
}) {
  // Get counts of games by status
  const backlogItemCounts = await prisma.backlogItem.groupBy({
    by: ['status'],
    where: {
      userId,
    },
    _count: {
      status: true,
    },
  });

  // Calculate total count
  const totalGames = backlogItemCounts.reduce(
    (acc, curr) => acc + curr._count.status,
    0,
  );

  // Create a map of status to count
  const statusCounts = backlogItemCounts.reduce(
    (acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Get counts by genre
  const genreCounts = await prisma.genre.findMany({
    select: {
      name: true,
      games: {
        where: {
          game: {
            backlogItems: {
              some: {
                userId,
              },
            },
          },
        },
        select: {
          gameId: true,
        },
      },
    },
  });

  // Find top 3 genres
  const topGenres = genreCounts
    .map((genre) => ({
      name: genre.name,
      count: genre.games.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <Card.Root p={4} height="full">
      <Heading size="md" mb={4}>
        Collection Stats
      </Heading>

      <VStack gap={3} align="stretch">
        <StatItem label="Total Games" value={totalGames} />
        <StatItem
          label="To Play"
          value={statusCounts.TO_PLAY || 0}
          percentage={
            totalGames
              ? Math.round(((statusCounts.TO_PLAY || 0) / totalGames) * 100)
              : 0
          }
        />
        <StatItem
          label="Playing"
          value={statusCounts.PLAYING || 0}
          percentage={
            totalGames
              ? Math.round(((statusCounts.PLAYING || 0) / totalGames) * 100)
              : 0
          }
        />
        <StatItem
          label="Completed"
          value={statusCounts.COMPLETED || 0}
          percentage={
            totalGames
              ? Math.round(((statusCounts.COMPLETED || 0) / totalGames) * 100)
              : 0
          }
        />

        <Separator my={2} />

        <Heading size="xs" mt={2}>
          Top Genres
        </Heading>
        {topGenres.length > 0 ? (
          topGenres.map((genre) => (
            <Text key={genre.name} fontSize="sm">
              {genre.name} ({genre.count})
            </Text>
          ))
        ) : (
          <Text fontSize="sm" color="gray.500">
            No genre data available
          </Text>
        )}
      </VStack>
    </Card.Root>
  );
}

function StatItem({
  label,
  value,
  percentage,
}: {
  label: string;
  value: number;
  percentage?: number;
}) {
  return (
    <Flex justify="space-between" align="center">
      <Text fontSize="sm">{label}</Text>
      <Flex align="center">
        <Text fontWeight="bold">{value}</Text>
        {percentage !== undefined && (
          <Text fontSize="xs" color="gray.500" ml={1}>
            ({percentage}%)
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
