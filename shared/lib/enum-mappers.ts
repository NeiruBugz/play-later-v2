import {
  AcquisitionType,
  BacklogItemStatus,
} from '@/shared/types/entities/BacklogItem';

export const BacklogStatusMapper: Record<BacklogItemStatus, string> = {
  TO_PLAY: 'Backlog',
  PLAYING: 'Playing',
  PLAYED: 'Played',
  COMPLETED: 'Completed',
  WISHLIST: 'Wishlist',
};

export const AcquisitionStatusMapper: Record<AcquisitionType, string> = {
  DIGITAL: 'Digital',
  PHYSICAL: 'Physical',
  SUBSCRIPTION: 'Subscription service',
};
