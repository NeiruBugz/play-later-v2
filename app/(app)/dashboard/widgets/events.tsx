import {
  Card,
  Heading,
  Text,
  VStack,
  Flex,
  Box,
  Badge,
  Image,
  IconButton,
} from '@chakra-ui/react';
import { IGDBClient } from '@/shared/external-apis/igdb/client';
import { IoCalendarOutline } from 'react-icons/io5';
import { Tooltip } from '@/shared/components/ui/tooltip';
import Link from 'next/link';

type GameEvent = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  type: 'UPDATE' | 'DLC' | 'SALE' | 'EVENT';
  imageUrl?: string;
  endDate?: Date;
};

function formatGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
}

function createGoogleCalendarUrl(event: GameEvent): string {
  const startDate = formatGoogleCalendarDate(event.date);
  const endDate = event.endDate
    ? formatGoogleCalendarDate(event.endDate)
    : formatGoogleCalendarDate(new Date(event.date.getTime() + 3600000));

  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', event.title);
  url.searchParams.append('dates', `${startDate}/${endDate}`);

  if (event.description) {
    url.searchParams.append('details', event.description);
  }

  url.searchParams.append('location', 'Gaming Event');

  return url.toString();
}

export default async function EventsWidget() {
  const igdbClient = new IGDBClient();

  const eventsResponse = await igdbClient.getEvents();

  if (!eventsResponse) {
    return renderEmptyState();
  }

  const transformedEvents: GameEvent[] = await Promise.all(
    eventsResponse.map(async (event) => {
      let imageUrl: string | undefined = undefined;
      if (event.event_logo) {
        const logos = await igdbClient.getEventLogo(event.event_logo);
        if (logos && logos.length > 0) {
          imageUrl = `https://images.igdb.com/igdb/image/upload/t_thumb/${logos[0].image_id}.jpg`;
        }
      }

      const startDate = new Date(event.start_time * 1000);
      const endDate = event.end_time
        ? new Date(event.end_time * 1000)
        : undefined;

      return {
        id: String(event.id),
        title: event.name,
        description: event.description || null,
        date: startDate,
        endDate,
        type: 'EVENT',
        imageUrl,
      };
    }),
  );

  const today = new Date();
  const upcomingEvents = transformedEvents
    .filter((event) => event.date > today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  if (upcomingEvents.length === 0) {
    return renderEmptyState();
  }

  return (
    <Card.Root p={4} height="full">
      <Heading size="md" mb={4}>
        Upcoming Events
      </Heading>

      <VStack gap={3} align="stretch">
        {upcomingEvents.map((event) => (
          <Box
            key={event.id}
            p={2}
            borderRadius="md"
            border="1px solid"
            borderColor="gray.400"
          >
            <Flex justify="space-between" align="center" mb={1} gap={2}>
              <Flex align="center" gap={2}>
                <Text fontWeight="semibold" fontSize="sm">
                  {event.title}
                </Text>
                <EventTypeBadge type={event.type} />
              </Flex>
              <Tooltip content="Add to Google Calendar">
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Add to calendar"
                >
                  <Link
                    href={createGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IoCalendarOutline />
                  </Link>
                </IconButton>
              </Tooltip>
            </Flex>

            {event.description && (
              <Text fontSize="xs" color="gray.400" mb={1} maxLines={2}>
                {event.description}
              </Text>
            )}

            <Flex justify="space-between" align="center">
              <Text fontSize="xs" color="gray.500">
                {formatDate(event.date)}
              </Text>

              {event.imageUrl && (
                <Box width="30px" height="30px">
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    borderRadius="sm"
                    width="100%"
                    height="100%"
                    objectFit="cover"
                  />
                </Box>
              )}
            </Flex>
          </Box>
        ))}
      </VStack>
    </Card.Root>
  );
}

function renderEmptyState() {
  return (
    <Card.Root p={4} height="full">
      <Heading size="md" mb={4}>
        Upcoming Events
      </Heading>

      <Flex
        justify="center"
        align="center"
        height="150px"
        direction="column"
        gap={2}
      >
        <Text color="gray.500">No upcoming events</Text>
        <Text fontSize="sm" color="gray.400">
          Stay tuned for gaming industry events
        </Text>
      </Flex>
    </Card.Root>
  );
}

function EventTypeBadge({ type }: { type: GameEvent['type'] }) {
  const colorPalette = {
    UPDATE: 'blue',
    DLC: 'purple',
    SALE: 'green',
    EVENT: 'yellow',
  }[type];

  return (
    <Badge colorPalette={colorPalette} fontSize="10px">
      {type}
    </Badge>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffInDays = Math.round(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Tomorrow';
  } else if (diffInDays < 7) {
    return `In ${diffInDays} days`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
