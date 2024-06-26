import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";

export async function deleteBacklogItem(backlogItemId: number) {
  const userId = await getServerUserId();

  if (!userId) {
    return;
  }

  try {
    await prisma.backlogItem.delete({
      where: {
        id: backlogItemId,
        userId,
      },
    });
  } catch (error) {
    console.error(error);
  }
}
