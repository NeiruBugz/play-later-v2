import Image from "next/image"
import Link from "next/link"
import { Game } from "@prisma/client"
import { differenceInHours, format, formatDistance } from "date-fns"
import { Hourglass } from "lucide-react"

import { platformEnumToColor, platformToUI } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

function Artwork({ game }: { game: Game }) {
  const transitionTime = differenceInHours(game.updatedAt, game.createdAt)
  return (
    <div className="h-[256px] w-32 cursor-pointer rounded-sm border bg-background shadow-md transition-all hover:scale-105 hover:shadow-xl md:h-[300px] md:w-48">
      <Image
        src={game.imageUrl}
        alt={`${game.title} cover art`}
        className="m-0 aspect-square w-40 rounded-t-sm object-cover object-top md:h-48 md:w-48"
        width={256}
        height={256}
        priority
      />
      <div className="flex flex-col justify-between gap-2 p-2 md:px-4 md:py-2">
        <div className="flex items-center justify-between">
          <Badge
            variant={
              game.platform ? platformEnumToColor(game.platform) : "default"
            }
            className="w-fit normal-case"
          >
            {platformToUI(game.platform as string)}
          </Badge>
          {transitionTime ? (
            <p className="item-center hidden gap-0.5 text-ellipsis text-xs font-bold md:flex">
              <Hourglass className="h-4 w-4" />
              <span>{transitionTime}h</span>
            </p>
          ) : null}
        </div>
        <p className="text-sm font-medium">{game.title}</p>
      </div>
    </div>
  )
}

export function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/library/${game.id}`}>
      <Artwork game={game} />
    </Link>
  )
}
