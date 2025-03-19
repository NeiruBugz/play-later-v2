import { createListCollection } from '@chakra-ui/react';
import {
  ACQUISITION_TYPE,
  BACKLOG_ITEM_STATUS,
  BacklogStatusMap,
  AcquisitionTypeMap,
} from './status-maps';

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
  items: enumToCollectionItems(BACKLOG_ITEM_STATUS, BacklogStatusMap),
});

export const platformCollection = createListCollection({
  items: [
    { value: 'pc', label: 'PC' },
    { value: 'xbox', label: 'Xbox' },
    { value: 'playstation', label: 'PlayStation' },
  ],
});

export const acquisitionTypeCollection = createListCollection({
  items: enumToCollectionItems(ACQUISITION_TYPE, AcquisitionTypeMap),
});
