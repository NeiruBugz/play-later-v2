'use client';

import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from '@/components/ui/pagination';
import { HStack } from '@chakra-ui/react';
import { useSearchParams, useRouter } from 'next/navigation';

export function CollectionPagination({ count }: { count: number }) {
  const params = useSearchParams();
  const router = useRouter();

  const onPageChange = (pageNumber: number) => {
    const paramsToUpdate = new URLSearchParams(params);
    paramsToUpdate.set('page', String(pageNumber));

    router.replace(`/collection?${paramsToUpdate.toString()}`);
  };

  if (count === 0) {
    return null;
  }

  return (
    <>
      <PaginationRoot
        count={count}
        pageSize={24}
        defaultPage={1}
        size="md"
        variant="subtle"
        page={Number(params.get('page') || 1)}
        onPageChange={(e) => onPageChange(e.page)}
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
