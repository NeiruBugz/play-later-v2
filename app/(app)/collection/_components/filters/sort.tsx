'use client';

import {
  SelectRoot,
  SelectContent,
  SelectTrigger,
  SelectValueText,
  SelectItem,
} from '@/shared/components/ui/select';
import { createListCollection } from '@chakra-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type SortOption = {
  label: string;
  value: string;
  field: string;
  direction: 'asc' | 'desc';
};

const sortOptions: SortOption[] = [
  {
    label: 'Title (A-Z)',
    value: 'title_asc',
    field: 'title',
    direction: 'asc',
  },
  {
    label: 'Title (Z-A)',
    value: 'title_desc',
    field: 'title',
    direction: 'desc',
  },
  {
    label: 'Release Date (Newest)',
    value: 'releaseDate_desc',
    field: 'releaseDate',
    direction: 'desc',
  },
  {
    label: 'Release Date (Oldest)',
    value: 'releaseDate_asc',
    field: 'releaseDate',
    direction: 'asc',
  },
  {
    label: 'Rating (Highest)',
    value: 'rating_desc',
    field: 'aggregatedRating',
    direction: 'desc',
  },
  {
    label: 'Rating (Lowest)',
    value: 'rating_asc',
    field: 'aggregatedRating',
    direction: 'asc',
  },
];

const sortCollection = createListCollection({
  items: sortOptions,
});

export function SortFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get('sort') || 'dateAdded_desc';

  const handleSortChange = (value: string[]) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value[0]);
    params.set('page', '1'); // Reset to first page when sorting changes
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <SelectRoot
      collection={sortCollection}
      value={[currentSort]}
      onValueChange={(e) => handleSortChange(e.value)}
      width="400px"
      size="md"
    >
      <SelectTrigger>
        <SelectValueText placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem item={option} key={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
