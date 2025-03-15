'use client';

import { Box, Button } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { LuX } from 'react-icons/lu';

export function ClearFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const onClearFilters = useCallback(() => {
    const paramsToUpdate = new URLSearchParams(params);
    const page = params.get('page');
    paramsToUpdate.delete('platform');
    paramsToUpdate.delete('search');
    paramsToUpdate.delete('page');
    paramsToUpdate.set('status', 'PLAYING');
    if (page) {
      paramsToUpdate.set('page', page);
    }
    router.replace(`/collection?${paramsToUpdate.toString()}`);
  }, [params, router]);

  if (params.size === 0 || (params.get('page') && params.size === 1))
    return null;

  return (
    <Button
      colorPalette="blue"
      variant="outline"
      onClick={onClearFilters}
      type="button"
      aria-label="Clear filters"
      size="sm"
    >
      <LuX />
      <Box flex="1">Clear filters</Box>
    </Button>
  );
}
