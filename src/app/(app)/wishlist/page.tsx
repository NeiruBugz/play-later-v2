import {
  Box,
  EmptyState,
  Flex,
  Heading,
  VStack,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { Suspense } from 'react';
import { CollectionPagination } from '../collection/_components/collection-pagination';
import Link from 'next/link';
import { GameWithBacklogItemsList } from '@/components/game/game-with-backlog-items-list';
import { getUserWishlistedGamesGroupedBacklog } from '@/features/wishlist/wishlist-actions';

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const awaitedParams = await searchParams;
  const { wishlistedGames, count } = await getUserWishlistedGamesGroupedBacklog(
    awaitedParams.page,
  );

  if (count === 0) {
    return (
      <Box>
        <Heading as="h2">Wishlist</Heading>
        <Flex justify="center" align="center">
          <EmptyState.Root>
            <VStack textAlign="center">
              <EmptyState.Title>Your wishlist is empty</EmptyState.Title>
              <EmptyState.Description>
                Try to{' '}
                <ChakraLink asChild fontWeight="500" textDecoration="underline">
                  <Link href="/collection/add">find</Link>
                </ChakraLink>{' '}
                new game to wish for
              </EmptyState.Description>
            </VStack>
          </EmptyState.Root>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <Heading as="h2">Wishlist</Heading>
      <Suspense fallback={'Loading...'}>
        <GameWithBacklogItemsList collection={wishlistedGames} />
      </Suspense>
      <Flex my={1} justify="center">
        <CollectionPagination count={count} />
      </Flex>
    </Box>
  );
}
