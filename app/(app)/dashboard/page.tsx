import { Suspense } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Card,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CurrentlyPlayingWidget from './widgets/currently-playing';
import CollectionStatsWidget from '@/app/(app)/dashboard/widgets/collection-stats';
import ComingSoonWidget from '@/app/(app)/dashboard/widgets/coming-soon';
import EventsWidget from '@/app/(app)/dashboard/widgets/events';
import GamingGoalsWidget from '@/app/(app)/dashboard/widgets/gaming-goals';
import RecentActivityWidget from '@/app/(app)/dashboard/widgets/recent-activity';
import RecommendationsWidget from '@/app/(app)/dashboard/widgets/recommendations';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>
        Your Gaming Dashboard
      </Heading>

      <Grid
        templateColumns={{
          base: 'repeat(1, 1fr)',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(4, 1fr)',
        }}
        gap={6}
      >
        <GridItem colSpan={{ base: 1, md: 2, lg: 2 }}>
          <Suspense fallback={<LoadingCard />}>
            <CurrentlyPlayingWidget userId={session.user?.id} />
          </Suspense>
        </GridItem>

        <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
          <Suspense fallback={<LoadingCard />}>
            <CollectionStatsWidget />
          </Suspense>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
          <Suspense fallback={<LoadingCard />}>
            <ComingSoonWidget />
          </Suspense>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1, lg: 2 }}>
          <Suspense fallback={<LoadingCard />}>
            <RecentActivityWidget userId={session.user?.id} />
          </Suspense>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
          <Suspense fallback={<LoadingCard />}>
            <RecommendationsWidget userId={session.user?.id} />
          </Suspense>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
          <Suspense fallback={<LoadingCard />}>
            <GamingGoalsWidget userId={session.user?.id} />
          </Suspense>
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 1, lg: 1 }}>
          <Suspense fallback={<LoadingCard />}>
            <EventsWidget />
          </Suspense>
        </GridItem>
      </Grid>
    </Box>
  );
}

function LoadingCard() {
  return (
    <Card.Root p={4} height="full" minHeight="200px">
      <Flex justify="center" align="center" height="full">
        <Spinner />
      </Flex>
    </Card.Root>
  );
}
