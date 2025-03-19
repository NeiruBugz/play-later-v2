import { Card, Heading, Text, VStack, Flex, Box } from '@chakra-ui/react';
import { prisma } from '@/prisma/client';

// In a real app, we would have actual time tracking data
// For this demo, we'll simulate it using completion data and HLTB estimates

export default async function TimePlayedWidget({
  userId,
}: {
  userId?: string;
}) {
  // Get completed games with their time estimates
  const completedGames = await prisma.game.findMany({
    where: {
      backlogItems: {
        some: {
          userId,
          status: 'COMPLETED',
        },
      },
    },
    select: {
      id: true,
      title: true,
      mainStory: true,
      mainExtra: true,
      completionist: true,
      backlogItems: {
        where: {
          userId,
          status: 'COMPLETED',
        },
        select: {
          completedAt: true,
        },
      },
    },
  });

  // Calculate estimated hours played
  // For simplicity, we'll use mainStory hours for each completed game
  const totalPlayTime = completedGames.reduce((total, game) => {
    return total + (game.mainStory || 0);
  }, 0);

  // Calculate hours by month (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      name: date.toLocaleDateString('en-US', { month: 'short' }),
      date,
    };
  }).reverse();

  const hoursByMonth = months.map((month) => {
    const nextMonth = new Date(month.date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const gamesCompletedInMonth = completedGames.filter((game) => {
      if (!game.backlogItems[0]?.completedAt) return false;
      const completedAt = new Date(game.backlogItems[0].completedAt);
      return completedAt >= month.date && completedAt < nextMonth;
    });

    const hours = gamesCompletedInMonth.reduce((total, game) => {
      return total + (game.mainStory || 0);
    }, 0);

    return {
      month: month.name,
      hours,
    };
  });

  // Find month with most hours for scaling the chart
  const maxHours = Math.max(...hoursByMonth.map((m) => m.hours), 1);

  return (
    <Card.Root p={4} height="full">
      <Heading size="md" mb={4}>
        Gaming Time
      </Heading>

      <VStack gap={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Text fontWeight="semibold">Total Played</Text>
          <Text fontWeight="bold">{totalPlayTime} hours</Text>
        </Flex>

        <Box>
          <Text fontSize="sm" mb={2}>
            Last 6 Months
          </Text>
          <Flex height="100px" align="flex-end" gap={1}>
            {hoursByMonth.map((data) => (
              <Flex key={data.month} direction="column" align="center" flex="1">
                <Box
                  width="100%"
                  height={`${Math.max((data.hours / maxHours) * 100, 4)}%`}
                  bg="blue.400"
                  borderRadius="sm"
                  transition="height 0.3s ease"
                  _hover={{
                    bg: 'blue.500',
                  }}
                />
                <Text fontSize="xs" mt={1}>
                  {data.month}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>

        {completedGames.length > 0 && (
          <Box>
            <Text fontSize="sm" mb={2}>
              Recently Completed
            </Text>
            <VStack gap={2} align="stretch">
              {completedGames
                .filter((game) => game.backlogItems[0]?.completedAt)
                .sort((a, b) => {
                  const dateA = new Date(a.backlogItems[0]?.completedAt || 0);
                  const dateB = new Date(b.backlogItems[0]?.completedAt || 0);
                  return dateB.getTime() - dateA.getTime();
                })
                .slice(0, 2)
                .map((game) => (
                  <Flex key={game.id} justify="space-between" align="center">
                    <Text fontSize="sm" maxLines={1}>
                      {game.title}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {game.mainStory || 0}h
                    </Text>
                  </Flex>
                ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Card.Root>
  );
}
