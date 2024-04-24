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
      where: {
        status: "BACKLOG",
        NOT: {
          userId: {
            equals: session,
          },
        },
        user: {
          name: {
            equals: name.replace("%20", " "),
          },
        },
      },
      select: {
        id: true,
        imageUrl: true,
        title: true,
      },
    });

    return userBackloggedGames;
  } catch (error) {
    console.error(error);
  }
};
