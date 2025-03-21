'use client';

import { Button } from '@chakra-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function ClearFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasFilters =
    searchParams.has('platform') ||
    searchParams.has('status') ||
    searchParams.has('search') ||
    (searchParams.has('sort') && searchParams.get('sort') !== 'dateAdded_desc');

  const handleClearFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('sort', 'dateAdded_desc'); // Reset to default sort
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!hasFilters) return null;

  return (
    <Button size="sm" variant="ghost" onClick={handleClearFilters}>
      Clear Filters
    </Button>
  );
}
