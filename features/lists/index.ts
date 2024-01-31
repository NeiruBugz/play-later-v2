"use server"

import { revalidatePath } from "next/cache"
import { Game, List } from "@prisma/client"

import { getServerUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getLists() {
  const userId = await getServerUserId()

  return await prisma.list.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

async function createList({
  name,
  games,
}: {
  name: List["name"]
  games?: Game[]
}) {
  const userId = await getServerUserId()

  const result = await prisma.list.create({
    data: {
      userId,
      name,
    },
  })

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
      })
    }
  }

  revalidatePath("/lists")
}

export { getLists, createList }
