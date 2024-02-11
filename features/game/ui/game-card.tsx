"use client"

import Image from "next/image"
import Link from "next/link"
import { DeleteFromList } from "@/features/game/ui/delete-from-list"
import { deleteGameFromList } from "@/features/lists"
import { Game } from "@prisma/client"
import { Clock } from "lucide-react"

import { platformEnumToColor, uppercaseToNormal } from "@/lib/utils"
import { Badge, ColorVariant } from "@/components/ui/badge"
import { RenderWhen } from "@/components/render-when"

function GameTimeBadge({ time }: { time: Game["gameplayTime"] | undefined }) {
  if (!time) {
    return null
  }

  return (
    <div className="flex w-fit items-center justify-center gap-1 rounded-full bg-slate-600 p-1 text-xs font-medium">
      <Clock className="h-3 w-3" />
      {time} h
    </div>
  )
}

function Artwork({ game }: { game: Partial<Game> }) {
  return (
    <div className="group relative flex cursor-pointer gap-4 rounded-sm border bg-background shadow-md transition-all">
      <div className="">
        <Image
          src={game.imageUrl ?? ""}
          alt={`${game.title} cover art`}
          className="!relative"
          priority
          fill
        />
      </div>
      <div className="flex flex-col gap-2 py-2 pr-4">
        <h6 className="w-full font-medium">{game.title}</h6>
        <RenderWhen condition={Boolean(game.platform)}>
          <div className="flex w-fit flex-col items-start gap-2 normal-case">
            <Badge
              variant={
                game.platform
                  ? (platformEnumToColor(game.platform) as ColorVariant)
                  : "default"
              }
            >
              {uppercaseToNormal(game.platform as string)}
            </Badge>

            <GameTimeBadge time={game.gameplayTime} />
          </div>
        </RenderWhen>
      </div>
    </div>
  )
}

export function GameCard({
  game,
  path = "library",
  entityId,
}: {
  game: Partial<Game>
  path?: string
  entityId?: string
}) {
  const onDelete = async () => {
    if (!game.id || !entityId) {
      return
    }

    if (path.includes("lists")) {
      try {
        await deleteGameFromList(entityId, game.id)
      } catch (error) {
        console.error(error)
      }
    }
  }
  return (
    <div className="group flex w-full flex-col-reverse items-center justify-center">
      {path === "lists" ? <DeleteFromList onDelete={onDelete} /> : null}
      <Link
        href={`/${path === "lists" ? "library" : path}/${game.id}`}
        className="block"
      >
        <Artwork game={game} />
      </Link>
    </div>
  )
}
