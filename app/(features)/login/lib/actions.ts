"use server";

import { getServerUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  return user?.username || user?.name;
}

export async function setUsername({ username }: { username: string }) {
  const id = await getServerUserId();
  await prisma.user.update({
    data: {
      username,
    },
    where: {
      id,
    },
  });
}
