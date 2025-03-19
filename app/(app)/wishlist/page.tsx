import {
  Box,
  EmptyState,
  Flex,
  Heading,
  VStack,
  Link as ChakraLink,
  Text,
} from '@chakra-ui/react';
import { Suspense } from 'react';
import { CollectionPagination } from '../collection/_components/collection-pagination';
import Link from 'next/link';
import { GameWithBacklogItemsList } from '@/shared/components/game/game-with-backlog-items-list';
import { getUserWishlistedGamesGroupedBacklog } from '@/features/wishlist/actions/wishlist-actions';

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const awaitedParams = await searchParams;
  const actionResult = await getUserWishlistedGamesGroupedBacklog({
    page: awaitedParams.page,
  });

  if (!actionResult || !actionResult.data) {
    console.error('Failed to fetch wishlist data');
    return (
      <Box>
        <Heading as="h2">Wishlist</Heading>
        <Text>Failed to load wishlist data. Please try again later.</Text>
      </Box>
    );
  }

  const { wishlistedGames, count } = actionResult.data;

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
