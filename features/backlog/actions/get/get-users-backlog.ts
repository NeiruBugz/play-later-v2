import { prisma } from "@/src/shared/api";

export async function getUsersBacklog({ backlogId }: { backlogId: string }) {
  try {
    return await prisma.backlogItem.findMany({
      where: { userId: backlogId },
      include: { game: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (e) {
    console.error("Error fetching user's backlog items:", e);
    return [];
  }
}
