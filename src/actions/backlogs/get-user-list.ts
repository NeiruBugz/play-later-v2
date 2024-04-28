"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/packages/prisma";

export const getUserList = async ({ name }: { name: string }) => {
  try {
    const session = await getServerUserId();
    if (!session) {
      throw new Error("Missing authentication");
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
