import { prisma } from "@/src/shared/api";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

type CreateBacklogItemInput = {
  backlogItem: {
    backlogStatus: string;
    acquisitionType: string;
    platform?: string;
    startedAt?: Date;
    completedAt?: Date;
  };
  userId: string;
  gameId: string;
};

export async function createBacklogItem({
  backlogItem,
  userId,
  gameId,
}: CreateBacklogItemInput): Promise<void> {
  try {
    await prisma.backlogItem.create({
      data: {
        status: backlogItem.backlogStatus as unknown as BacklogItemStatus,
        acquisitionType:
          backlogItem.acquisitionType as unknown as AcquisitionType,
        platform: backlogItem.platform,
        startedAt: backlogItem.startedAt,
        completedAt: backlogItem.completedAt,
        User: {
          connect: {
            id: userId,
          },
        },
        game: {
          connect: {
            id: gameId,
          },
        },
      },
    });
    revalidatePath("/collection");
  } catch (e) {
    console.error(e);
  }
}
