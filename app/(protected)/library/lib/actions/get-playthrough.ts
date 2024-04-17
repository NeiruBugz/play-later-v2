"use server";

import { getServerUserId } from "@/auth";
import { Playthrough } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const getPlaythrough = async ({ id }: { id: Playthrough["id"] }) => {
  try {
    const session = await getServerUserId();

    if (!session) {
      throw new Error("");
    }

    return prisma.playthrough.findUnique({
      where: {
        userId: session,
        id,
      },
    });
  } catch (e) {
    console.error(e);
  }
};
