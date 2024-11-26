import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import { revalidatePath } from "next/cache";

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
    revalidatePath("/", "page");
  } catch (error) {
    console.error(error);
  }
}
