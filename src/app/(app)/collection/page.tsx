import { Filters } from '@/app/(app)/collection/_components/filters';
import { getUserGamesWithGroupedBacklogAction } from '@/server/actions/gameActions';
import { Box, Flex, Heading } from '@chakra-ui/react';
import { Suspense } from 'react';
import { CollectionPagination } from './_components/collection-pagination';
import { GameWithBacklogItemsList } from '@/components/game/game-with-backlog-items-list';

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const awaitedParams = await searchParams;

  const { collection, count } = await getUserGamesWithGroupedBacklogAction({
    platform: awaitedParams.platform,
    status: awaitedParams.status,
    search: awaitedParams.search,
    page: Number(awaitedParams.page) || 1,
  });

  return (
    <Box>
      <Heading as="h2">Collection</Heading>
      <Filters />
      <Suspense fallback={'Loading...'}>
        <GameWithBacklogItemsList collection={collection} />
      </Suspense>
      <Flex my={1} justify="center">
        <CollectionPagination count={count} />
      </Flex>
    </Box>
  );
}
