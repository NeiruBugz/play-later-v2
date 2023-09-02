import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import { getServerUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const userId = await getServerUserId()
  const games = await prisma.game.findMany({
    where: { userId: userId },
  })

  revalidatePath("/library")

  return NextResponse.json({ games })
}
