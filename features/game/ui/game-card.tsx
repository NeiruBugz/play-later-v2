import Image from "next/image"
import Link from "next/link"
import { Game } from "@prisma/client"

import { platformEnumToColor, uppercaseToNormal } from "@/lib/utils"
import { Badge, ColorVariant } from "@/components/ui/badge"
import { RenderWhen } from "@/components/render-when"

function Artwork({ game }: { game: Partial<Game> }) {
  return (
    <div className="group relative cursor-pointer rounded-sm border bg-background text-white shadow-md transition-all">
      <div className="size-32 sm:size-36 md:size-48 xl:size-52 flex items-center justify-center">
        <Image
          src={game.imageUrl ?? ""}
          alt={`${game.title} cover art`}
          className="h-full w-full object-cover"
          width={256}
          height={256}
          priority
        />
      </div>
      <div className="absolute bottom-0 left-0 hidden w-32 flex-col justify-between gap-2 bg-slate-800/70 p-2 group-hover:flex sm:w-36 md:w-48 md:px-4 md:py-2 xl:w-52">
        <div className="flex items-center justify-between">
          <RenderWhen condition={Boolean(game.platform)}>
            <Badge
              variant={
                game.platform
                  ? (platformEnumToColor(game.platform) as ColorVariant)
                  : "default"
              }
              className="w-fit normal-case"
            >
              {uppercaseToNormal(game.platform as string)}
            </Badge>
          </RenderWhen>
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
