import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";

export async function getBacklogChartData() {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return [];
    }

    return await prisma.$transaction(async () => {
      const backloggedItems = await prisma.backlogItem.count({
        where: {
          userId: userId,
          status: "TO_PLAY",
        },
      });
      const playingCount = await prisma.backlogItem.count({
        where: {
          userId: userId,
          status: "PLAYING",
        },
      });

      const completedCount = await prisma.backlogItem.count({
        where: {
          userId: userId,
          status: "COMPLETED",
        },
      });
      const playedCount = await prisma.backlogItem.count({
        where: {
          userId: userId,
          status: "PLAYED",
        },
      });
      const wishlistCount = await prisma.backlogItem.count({
        where: {
          userId: userId,
          status: "WISHLIST",
        },
      });

      return [
        { type: "Backlogged", games: backloggedItems, status: "TO_PLAY" },
        { type: "Played", games: playedCount, status: "PLAYED" },
        { type: "Playing", games: playingCount, status: "PLAYING" },
        { type: "Completed", games: completedCount, status: "COMPLETED" },
        { type: "Wishlist", games: wishlistCount, status: "WISHLIST" },
      ];
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}
