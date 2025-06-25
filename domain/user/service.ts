import { prisma } from "@/shared/lib/db";

export const UserService = {
  async getUserBySteamId(userId: string, steamId: string) {
    const user = await prisma.user.findFirst({
      where: {
        steamId64: steamId,
        id: { not: userId },
      },
    });

    if (!user) {
      return null;
    }

    return user;
  },

  async updateUserSteamData({
    userId,
    username,
    avatar,
    steamId,
  }: {
    userId: string;
    steamId: string;
    username: string;
    avatar: string;
  }) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        steamId64: steamId,
        steamUsername: username,
        steamAvatar: avatar,
      },
    });
  },
};
