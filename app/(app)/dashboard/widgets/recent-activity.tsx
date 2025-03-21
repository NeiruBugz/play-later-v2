import {
  Card,
  Heading,
  Text,
  VStack,
  Flex,
  Box,
  Image,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { prisma } from '@/prisma/client';
import { IMAGE_API, IMAGE_SIZES } from '@/shared/config/igdb.image.config';
import { BacklogItemStatus } from '@prisma/client';
import {
  IoAddCircleOutline,
  IoCheckmarkCircleOutline,
  IoGameControllerOutline,
  IoStarOutline,
} from 'react-icons/io5';

type ActivityItem = {
  type: 'ADDED' | 'STARTED' | 'COMPLETED' | 'REVIEWED';
  date: Date;
  game: {
    id: string;
    title: string;
    coverImage: string | null;
  };
  metadata?: {
    rating: number;
  };
};

export default async function RecentActivityWidget({
  userId,
}: {
  userId?: string;
}) {
  const recentlyAddedGames = await prisma.backlogItem.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          coverImage: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  // Get recently started games
  const recentlyStartedGames = await prisma.backlogItem.findMany({
    where: {
      userId,
      status: BacklogItemStatus.PLAYING,
      startedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          coverImage: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: 10,
  });

  // Get recently completed games
  const recentlyCompletedGames = await prisma.backlogItem.findMany({
    where: {
      userId,
      status: BacklogItemStatus.COMPLETED,
      completedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          coverImage: true,
        },
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
    take: 10,
  });

  // Get recent reviews
  const recentReviews = await prisma.review.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    include: {
      game: {
        select: {
          id: true,
          title: true,
          coverImage: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  const activities: ActivityItem[] = [
    ...recentlyAddedGames.map((item) => ({
      type: 'ADDED' as const,
      date: item.createdAt,
      game: item.game,
    })),
    ...recentlyStartedGames.map((item) => ({
      type: 'STARTED' as const,
      date: item.startedAt!,
      game: item.game,
    })),
    ...recentlyCompletedGames.map((item) => ({
      type: 'COMPLETED' as const,
      date: item.completedAt!,
      game: item.game,
    })),
    ...recentReviews.map((review) => ({
      type: 'REVIEWED' as const,
      date: review.createdAt,
      game: review.game,
      metadata: { rating: review.rating },
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return (
    <Card.Root p={4} height="full">
      <Heading size="md" mb={4}>
        Recent Activity
      </Heading>

      {activities.length === 0 ? (
        <Flex
          justify="center"
          align="center"
          height="150px"
          direction="column"
          gap={2}
        >
          <Text color="gray.500">No recent activity</Text>
          <Text fontSize="sm" color="gray.400">
            Your recent game-related activity will appear here
          </Text>
        </Flex>
      ) : (
        <VStack gap={3} align="stretch">
          {activities.map((activity, index) => (
            <Flex
              key={`${activity.game.id}-${activity.type}-${index}`}
              gap={3}
              align="center"
            >
              <Box minWidth="40px" height="60px" position="relative">
                {activity.game.coverImage ? (
                  <Image
                    src={`${IMAGE_API}/${IMAGE_SIZES['c-sm']}/${activity.game.coverImage}.webp`}
                    alt={activity.game.title}
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
                <Flex align="center" gap={2}>
                  {getActivityIcon(activity.type)}
                  <Text fontWeight="semibold" fontSize="sm" maxLines={1}>
                    {activity.game.title}
                  </Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text fontSize="xs" color="gray.500">
                    {getActivityDescription(activity.type)}
                    {activity.type === 'REVIEWED' &&
                      activity.metadata?.rating && (
                        <Badge
                          ml={1}
                          colorPalette="yellow"
                          fontSize="10px"
                          verticalAlign="middle"
                        >
                          {activity.metadata.rating}/10
                        </Badge>
                      )}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {formatRelativeTime(activity.date)}
                  </Text>
                </Flex>
              </Box>
            </Flex>
          ))}
        </VStack>
      )}
    </Card.Root>
  );
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'ADDED':
      return (
        <Icon color="blue.400">
          <IoAddCircleOutline />
        </Icon>
      );
    case 'STARTED':
      return (
        <Icon color="green.400">
          <IoGameControllerOutline />
        </Icon>
      );
    case 'COMPLETED':
      return (
        <Icon color="purple.400">
          <IoCheckmarkCircleOutline />
        </Icon>
      );
    case 'REVIEWED':
      return (
        <Icon color="yellow.400">
          <IoStarOutline />
        </Icon>
      );
  }
}

function getActivityDescription(type: ActivityItem['type']) {
  switch (type) {
    case 'ADDED':
      return 'Added to collection';
    case 'STARTED':
      return 'Started playing';
    case 'COMPLETED':
      return 'Completed';
    case 'REVIEWED':
      return 'Reviewed';
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
