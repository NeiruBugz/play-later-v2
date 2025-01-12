import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import { User, type BacklogItem, type Game } from "@prisma/client";

type UserWithBacklogItems = {
  user: User;
  backlogItems: (BacklogItem & { game: Game })[];
};

export async function getBacklogs(): Promise<UserWithBacklogItems[]> {
  const userId = await getServerUserId();
  if (!userId) return [];

  try {
    const userGames = await prisma.backlogItem.findMany({
      where: { userId: { not: userId } },
      include: { game: true, User: true },
      orderBy: { createdAt: "asc" },
    });

    const groupedByUser = userGames.reduce(
      (acc: Record<string, UserWithBacklogItems>, item) => {
        const { User, ...backlogItem } = item;
        acc[User.id] ??= { user: User, backlogItems: [] };
        acc[User.id].backlogItems.push(item);
        return acc;
      },
      {}
    );

    return Object.values(groupedByUser);
  } catch (e) {
    console.error("Error fetching user backlogs:", e);
    return [];
  }
}
