import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import { BacklogItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

type UpdateBacklogItemInput = {
  id: number;
  platform: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
};

export async function updateBacklogItem(payload: UpdateBacklogItemInput) {
  try {
    const userId = await getServerUserId();
    if (!userId) throw new Error("User not found");

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
  } catch (error) {
    console.error("Error updating backlog item:", error);
  }
}
