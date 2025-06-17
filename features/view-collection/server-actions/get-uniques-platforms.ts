import { getServerUserId } from "@/auth";
import { prisma } from "@/shared/lib/db";

export async function getUserUniquePlatforms(): Promise<(string | null)[]> {
  const userId = await getServerUserId();

  try {
    const platforms = await prisma.backlogItem.findMany({
      where: {
        userId: userId,
      },
      select: {
        platform: true,
      },
      distinct: ["platform"],
    });

    return platforms.map((item) => item.platform).filter(Boolean);
  } catch (error) {
    console.error("Error fetching user game collection:", error);
    return [];
  }
}
