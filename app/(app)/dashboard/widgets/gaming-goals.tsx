import { Card, Heading, Text, VStack, Box, Progress } from '@chakra-ui/react';
import { prisma } from '@/prisma/client';

export default async function GamingGoalsWidget({
  userId,
}: {
  userId?: string;
}) {
  // Get counts for different statuses
  const statusCounts = await prisma.backlogItem.groupBy({
    by: ['status'],
    where: {
      userId,
    },
    _count: {
      status: true,
    },
  });

  // Create a map of status to count
  const counts = statusCounts.reduce(
    (acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate the completion rate (completed games / total games)
  const totalGames = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const completedGames = counts.COMPLETED || 0;
  const completionRate =
    totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;

  // Get count of games completed this year
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const completedThisYear = await prisma.backlogItem.count({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: {
        gte: startOfYear,
      },
    },
  });

  // Define a yearly goal (12 games per year = 1 per month)
  const yearlyGoal = 12;
  const yearlyProgress = Math.min(
    Math.round((completedThisYear / yearlyGoal) * 100),
    100,
  );

  // Calculate backlog growth (ratio of added vs completed)
  const backlogGrowth =
    totalGames > 0 && completedGames > 0
      ? Math.round(((counts.TO_PLAY || 0) / completedGames) * 100)
      : 0;

  return (
    <Card.Root p={4} height="full">
      <Heading size="md" mb={4}>
        Gaming Goals
      </Heading>

      <VStack gap={4} align="stretch">
        <GoalItem
          label="Completion Rate"
          value={`${completionRate}%`}
          progress={completionRate}
          colorScheme="purple"
        />

        <GoalItem
          label={`Games This Year (${completedThisYear}/${yearlyGoal})`}
          value={`${yearlyProgress}%`}
          progress={yearlyProgress}
          colorScheme="green"
        />

        <GoalItem
          label="In Progress"
          value={counts.PLAYING || 0}
          progress={Math.min(((counts.PLAYING || 0) / 3) * 100, 100)} // Target: 3 games in progress
          colorScheme="orange"
          hidePercentage
        />

        <GoalItem
          label="Backlog Growth"
          value={backlogGrowth ? `${backlogGrowth}%` : 'N/A'}
          progress={backlogGrowth > 100 ? 100 : backlogGrowth}
          colorScheme="red"
        />
      </VStack>
    </Card.Root>
  );
}

function GoalItem({
  label,
  value,
  progress,
  colorScheme = 'blue',
  hidePercentage = false,
}: {
  label: string;
  value: string | number;
  progress: number;
  colorScheme?: string;
  hidePercentage?: boolean;
}) {
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="sm">{label}</Text>
        <Text fontSize="sm" fontWeight="bold">
          {value}
        </Text>
      </Flex>
      <Progress.Root
        value={progress}
        colorPalette={colorScheme}
        size="sm"
        borderRadius="full"
      >
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
        <Progress.Label />
        <Progress.ValueText />
      </Progress.Root>
      {!hidePercentage && (
        <Text fontSize="xs" color="gray.500" textAlign="right" mt={0.5}>
          {progress}%
        </Text>
      )}
    </Box>
  );
}

// Add Flex import at the top to fix the component
import { Flex } from '@chakra-ui/react';
