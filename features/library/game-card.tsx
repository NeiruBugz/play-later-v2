import Image from "next/image"
import Link from "next/link"
import { Game } from "@prisma/client"
import { format, formatDistance } from "date-fns"

import { platformEnumToColor, platformToUI } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

function Artwork({ game }: { game: Game }) {
  return (
    <div className="max-w-32 h-[310px] cursor-pointer rounded-sm border shadow-md hover:shadow-xl">
      <Image
        src={game.imageUrl}
        alt={`${game.title} cover art`}
        className="m-0 aspect-square h-48 w-48 bg-slate-400/60 object-scale-down"
        width={256}
        height={256}
        priority
      />
      <div className="flex flex-col justify-evenly gap-1 px-4 py-2">
        <Badge
          variant={
            game.platform ? platformEnumToColor(game.platform) : "default"
          }
          className="w-fit normal-case"
        >
          {platformToUI(game.platform as string)}
        </Badge>
        <p className="text-md w-40 whitespace-pre-wrap font-medium">
          {game.title}
        </p>
        <p className="text-xs">
          Last update: {format(game.updatedAt, "dd, MMM yyyy")}
        </p>
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
