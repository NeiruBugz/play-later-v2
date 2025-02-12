'use client';

import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from '@/components/ui/pagination';
import { HStack } from '@chakra-ui/react';

export function CollectionPagination({ count }: { count: number }) {
  return (
    <>
      <PaginationRoot
        count={count}
        pageSize={2}
        defaultPage={1}
        size="md"
        variant="solid"
      >
        <HStack>
          <PaginationPrevTrigger />
          <PaginationItems />
          <PaginationNextTrigger />
        </HStack>
      </PaginationRoot>
    </>
  );
}
