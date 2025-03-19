import {
  AcquisitionType,
  BacklogItemStatus,
} from '@/shared/types/entities/BacklogItem';

export const BACKLOG_ITEM_STATUS = {
  TO_PLAY: 'TO_PLAY',
  PLAYED: 'PLAYED',
  PLAYING: 'PLAYING',
  COMPLETED: 'COMPLETED',
  WISHLIST: 'WISHLIST',
} as const;

export const ACQUISITION_TYPE = {
  DIGITAL: 'DIGITAL',
  PHYSICAL: 'PHYSICAL',
  SUBSCRIPTION: 'SUBSCRIPTION',
} as const;

export const BacklogStatusMap: Record<BacklogItemStatus, string> = {
  TO_PLAY: 'Backlog',
  PLAYING: 'Playing',
  PLAYED: 'Played',
  COMPLETED: 'Completed',
  WISHLIST: 'Wishlist',
};

export const AcquisitionTypeMap: Record<AcquisitionType, string> = {
  DIGITAL: 'Digital',
  PHYSICAL: 'Physical',
  SUBSCRIPTION: 'Subscription service',
};
