import { createListCollection } from '@chakra-ui/react';
import { AcquisitionStatusMapper, BacklogStatusMapper } from './enum-mappers';

export const BACKLOG_ITEM_STATUS = {
  TO_PLAY: 'TO_PLAY',
  PLAYED: 'PLAYED',
  PLAYING: 'PLAYING',
  COMPLETED: 'COMPLETED',
  WISHLIST: 'WISHLIST',
} as const;

export const ACQUISITION_TYPE = {
  PHYSICAL: 'PHYSICAL',
  DIGITAL: 'DIGITAL',
  SUBSCRIPTION: 'SUBSCRIPTION',
} as const;

export function enumToCollectionItems<T extends string>(
  enumObj: Record<string, T>,
  labelMapper?: Record<string, string>,
) {
  return Object.values(enumObj).map((value) => ({
    value,
    label: labelMapper?.[value] || formatEnumValue(value),
  }));
}

export function formatEnumValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const statusCollection = createListCollection({
  items: enumToCollectionItems(BACKLOG_ITEM_STATUS, BacklogStatusMapper),
});

export const platformCollection = createListCollection({
  items: [
    { value: 'pc', label: 'PC' },
    { value: 'xbox', label: 'Xbox' },
    { value: 'playstation', label: 'PlayStation' },
  ],
});

export const acquisitionTypeCollection = createListCollection({
  items: enumToCollectionItems(ACQUISITION_TYPE, AcquisitionStatusMapper),
});
