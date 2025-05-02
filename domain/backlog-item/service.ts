import { getServerUserId } from "@/auth";
import { prisma } from "@/shared/lib/db";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type {
  CreateBacklogItemInput,
  UpdateBacklogItemInput,
  UpdateBacklogItemStatusInput,
} from "./types";

export const BacklogItemService = {
  create: async ({
    backlogItem,
    gameId,
  }: CreateBacklogItemInput): Promise<void> => {
    const userId = await getServerUserId();

    if (!userId) {
      return;
    }
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
  },
  delete: async (backlogItemId: number) => {
    const userId = await getServerUserId();

    if (!userId) {
      return;
    }
    try {
      await prisma.backlogItem.delete({
        where: { id: backlogItemId },
      });
    } catch (e) {
      console.error(e);
    }
  },

  update: async (payload: UpdateBacklogItemInput): Promise<void> => {
    const userId = await getServerUserId();

    if (!userId) {
      return;
    }

    try {
      await prisma.backlogItem.update({
        where: { id: payload.id },
        data: {
          platform: payload.platform,
          status: payload.status as unknown as BacklogItemStatus,
          startedAt: payload.startedAt,
          completedAt: payload.completedAt,
        },
      });
      revalidatePath("/collection");
    } catch (e) {
      console.error(e);
    }
  },

  updateStatus: async (payload: UpdateBacklogItemStatusInput) => {
    const userId = await getServerUserId();

    if (!userId) throw new Error("User not found");

    try {
      await prisma.backlogItem.update({
        where: { id: payload.id },
        data: {
          status: payload.status as unknown as BacklogItemStatus,
        },
      });
      revalidatePath("/collection");
    } catch (error) {
      console.error("Error updating backlog item:", error);
    }
  },
};
