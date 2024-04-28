"use server";

import { getServerUserId } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { Playthrough } from "@prisma/client";

export const getPlaythrough = async ({ id }: { id: Playthrough["id"] }) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      throw new Error("");
    }

    return prisma.playthrough.findUnique({
      where: {
        id,
        userId: session,
      },
    });
  } catch (e) {
    console.error(e);
  }
};
