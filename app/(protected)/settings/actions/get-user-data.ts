"use server";

import { getServerUserId } from "@/auth";

import { prisma } from "@/lib/prisma";

export type GetUserData = {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
};

export const getUserData = async () => {
  try {
    const session = await getServerUserId();
    if (!session) {
      throw new Error("No session found");
    }

    const userData = await prisma.user.findUnique({
      where: {
        id: session,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
      },
    });

    if (userData) {
      return userData as GetUserData;
    }
    return null;
  } catch (error) {
    console.log(error);
  }
};
