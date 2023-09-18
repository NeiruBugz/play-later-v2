import Image from "next/image"
import Link from "next/link"
import { Game } from "@prisma/client"

import { platformEnumToColor, platformToUI } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

function Artwork({ game }: { game: Partial<Game> }) {
  return (
    <div className="h-[256px] w-32 cursor-pointer rounded-sm border bg-background shadow-md transition-all hover:scale-105 hover:shadow-xl md:h-[300px] md:w-48">
      <Image
        src={game.imageUrl ?? ""}
        alt={`${game.title} cover art`}
        className="m-0 aspect-square w-40 rounded-t-sm object-cover object-top md:h-48 md:w-48"
        width={256}
        height={256}
        priority
      />
      <div className="flex flex-col justify-between gap-2 p-2 md:px-4 md:py-2">
        <div className="flex items-center justify-between">
          {game.platform ? (
            <Badge
              variant={
                game.platform ? platformEnumToColor(game.platform) : "default"
              }
              className="w-fit normal-case"
            >
              {platformToUI(game.platform as string)}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm font-medium">{game.title}</p>
      </div>
    </div>
  )
}

export function GameCard({
  game,
  path = "library",
}: {
  game: Partial<Game>
  path?: string
}) {
  return (
    <Link href={`/${path}/${game.id}`} className="block w-32 md:w-48">
      <Artwork game={game} />
    </Link>
  )
}
