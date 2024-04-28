"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/lib/prisma";

export const getUserList = async ({ name }: { name: string }) => {
  try {
    const session = await getServerUserId();
    if (!session) {
      throw new Error();
    }

    const userBackloggedGames = await prisma.game.findMany({
      select: {
        id: true,
        imageUrl: true,
        title: true,
      },
      where: {
        NOT: {
          userId: {
            equals: session,
          },
        },
        status: "BACKLOG",
        user: {
          name: {
            equals: name.replace("%20", " "),
          },
        },
      },
    });

    return userBackloggedGames;
  } catch (error) {
    console.error(error);
  }
};
