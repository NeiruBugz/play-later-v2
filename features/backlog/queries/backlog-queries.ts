import { prisma } from '@/prisma/client';
import type {
  AcquisitionType,
  BacklogItemStatus,
} from '@/shared/types/entities/BacklogItem';

export async function createBacklogRecord(backlogData: {
  status: BacklogItemStatus;
  acquisitionType: AcquisitionType;
  platform: string;
  gameId: string;
  userId: string;
}) {
  return prisma.backlogItem.create({
    data: backlogData,
  });
}
