import { prisma } from "@/shared/lib/db.server";
import { mapP2025ToNotFound } from "@/shared/lib/prisma";

export async function acknowledgeStatusModelNotice(
  userId: string
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { statusModelNoticePending: false },
      select: { id: true },
    });
  } catch (error) {
    mapP2025ToNotFound(error, "User not found while acknowledging notice", {
      userId,
    });
  }
}
