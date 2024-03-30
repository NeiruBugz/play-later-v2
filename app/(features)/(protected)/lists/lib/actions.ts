"use server";

import { revalidatePath } from "next/cache";
import { Game, List } from "@prisma/client";

import { getServerUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getLists() {
  const userId = await getServerUserId();

  return prisma.list.findMany({
    where: {
      userId: userId,
      deletedAt: null,
    },
    orderBy: {
      updatedAt: "desc" as "asc" | "desc",
    },
  });
}

async function createList({
  name,
  games,
}: {
  name: List["name"];
  games?: Game[];
}) {
  const userId = await getServerUserId();

  const result = await prisma.list.create({
    data: {
      userId,
      name,
    },
  });

  if (games && result.id) {
    for (const game of games) {
      await prisma.game.update({
        where: {
          userId,
          id: game.id,
        },
        data: {
          listId: result.id,
        },
      });
    }
  }

  revalidatePath("/lists");
}

async function getList(id: List["id"]) {
  const userId = await getServerUserId();
  return prisma.list.findUnique({
    where: {
      userId,
      id,
    },
  });
}

async function deleteList(id: List["id"]) {
  const userId = await getServerUserId();
  await prisma.list.update({
    where: {
      userId,
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  revalidatePath("/lists");
}

export { getLists, createList, getList, deleteList };
