"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";
import { sessionErrorHandler } from "@/src/packages/utils";


export const getUserList = async ({ name }: { name: string }) => {
  try {
    const session = await getServerUserId();
    if (!session) {
      sessionErrorHandler();
      return;
    }

    return await prisma.game.findMany({
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
  } catch (error) {
    console.error(error);
  }
};
