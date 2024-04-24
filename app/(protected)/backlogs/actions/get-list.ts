"use server";

import { getServerUserId } from "@/auth";

import { prisma } from "@/lib/prisma";

type BackloggedWithUser = {
  id: string;
  imageUrl: string;
  title: string;
  user: {
    name?: string | null;
    username?: string | null;
  };
};

const groupByUserName = (data?: BackloggedWithUser[]) => {
  if (!data) {
    return [];
  }

  const groupedData: Record<string, BackloggedWithUser[]> = {};
  data.forEach((item) => {
    const userName = item.user.name;
    if (!userName) {
      return;
    }
    if (!groupedData[userName]) {
      groupedData[userName] = [];
    }
    groupedData[userName].push(item);
  });
  return groupedData;
};

export const getList = async () => {
  try {
    const session = await getServerUserId();
    if (!session) {
      throw new Error();
    }

    const allBackloggedGames = await prisma.game.findMany({
      where: {
        status: "BACKLOG",
        NOT: {
          userId: {
            equals: session,
          },
        },
      },
      select: {
        id: true,
        imageUrl: true,
        title: true,
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    });

    return groupByUserName(allBackloggedGames);
  } catch (error) {
    console.error(error);
  }
};
