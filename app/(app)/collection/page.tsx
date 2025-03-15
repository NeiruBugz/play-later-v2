import { Filters } from './_components/filters';
import { Box, Flex, Heading } from '@chakra-ui/react';
import { Suspense } from 'react';
import { CollectionPagination } from './_components/collection-pagination';
import { GameWithBacklogItemsList } from '@/shared/components/game/game-with-backlog-items-list';
import { getUserGamesWithGroupedBacklog } from '@/features/backlog/actions/backlog-actions';
import { z } from 'zod';
import { DrawerFilter } from './_components/drawer-filter';

const collectionPageSearchParamsSchema = z
  .object({
    platform: z.string().optional().default(''),
    status: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().default('1'),
  })
  .transform((params) => ({
    platform: params.platform,
    status: params.status,
    search: params.search,
    page: Number(params.page),
  }));

type CollectionPageSearchParams = z.infer<
  typeof collectionPageSearchParamsSchema
>;

export default async function CollectionPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const resolvedSearchParams = await searchParamsPromise;

  const parsedSearchParams =
    collectionPageSearchParamsSchema.safeParse(resolvedSearchParams);

  let filterParams: CollectionPageSearchParams;

  if (parsedSearchParams.success) {
    filterParams = parsedSearchParams.data;
  } else {
    console.warn(
      'Invalid search params, using defaults:',
      parsedSearchParams.error,
    );
    filterParams = collectionPageSearchParamsSchema.parse({});
  }

  const { collection, count } =
    await getUserGamesWithGroupedBacklog(filterParams);

  return (
    <Box>
      <Flex gap={2} align="center">
        <Heading as="h2">Collection</Heading>
        <DrawerFilter />
      </Flex>
      <Suspense fallback={'Loading...'}>
        <Filters />
      </Suspense>
      <Suspense fallback={'Loading...'}>
        <GameWithBacklogItemsList collection={collection} />
      </Suspense>
      <Flex my={1} justify="center">
        <CollectionPagination count={count} />
      </Flex>
    </Box>
  );
}
