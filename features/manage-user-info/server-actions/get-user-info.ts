"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/shared/lib/db";

export async function getUserInfo(userId?: string) {
  try {
    const serverUserId = await getServerUserId();
    if (!serverUserId) {
      throw new Error("Can't find user");
    }
    const user = await prisma.user.findUnique({
      where: { id: userId ?? serverUserId },
      select: {
        id: true,
        name: true,
        username: true,
        steamProfileURL: true,
        steamConnectedAt: true,
        email: true,
      },
    });

    if (!user) {
      throw new Error("No user with this id");
    }

    return user;
  } catch (error) {
    console.error(error);
  }
}
