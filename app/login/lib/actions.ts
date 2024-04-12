"use server";

import { redirect } from "next/navigation";
import { getServerUserId } from "@/auth";

import { prisma } from "@/lib/prisma";

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    return user?.username || user?.name;
  } catch (error) {
    redirect("/");
  }
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
