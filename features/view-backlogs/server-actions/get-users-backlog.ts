import { prisma } from "@/shared/lib/db";

export async function getUsersBacklog({ username }: { username: string }) {
  try {
    return await prisma.backlogItem.findMany({
      where: { User: { username: username } },
      include: { game: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (e) {
    console.error("Error fetching user's backlog items:", e);
    return [];
  }
}
