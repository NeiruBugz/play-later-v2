"use server";

import { auth } from "@/auth";
import { Playthrough } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const getPlaythrough = async ({ id }: { id: Playthrough["id"] }) => {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      throw new Error("");
    }

    return prisma.playthrough.findUnique({
      where: {
        userId: session.user.id,
        id,
      },
    });
  } catch (e) {
    console.error(e);
  }
};
