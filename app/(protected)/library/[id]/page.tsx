import Image from "next/image"
import Link from "next/link"
import { getGame } from "@/data/games"
import { ArrowLeft } from "lucide-react"
import { nanoid } from "nanoid"

import { platformEnumToColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const prepareDescription = (value: string) => {
  if (!value) {
    return ""
  }

  let purified = value.slice()
  purified = purified.replace(" ...Read More", "").trim()
  const metaIndex = purified.indexOf("How long is")
  return purified.slice(0, metaIndex)
}

export default async function GamePage({ params }: { params: { id: string } }) {
  const gameInfo = await getGame(params.id)
  console.log(gameInfo)
  return (
    <div>
      <header className="flex items-center gap-2">
        <Link href="/library">
          <Button
            variant="outline"
            className="h-full px-2 py-1 md:px-4 md:py-2"
          >
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          {gameInfo.name}
        </h1>
      </header>
      <div className="mt-6 flex flex-col gap-4 md:flex-row">
        <Image
          src={gameInfo.imageUrl}
          alt={`${gameInfo.name} artwork`}
          width={760}
          height={570}
          priority
          className="aspect-[3/4] w-64"
        />
        <article>
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            {prepareDescription(gameInfo.description)}
          </p>
          <p className="mt-2 font-bold">Platforms: </p>
          <ul className="flex flex-wrap gap-2">
            {gameInfo.platforms.map((platform) => (
              <li key={nanoid()}>
                <Badge variant={platformEnumToColor(platform)}>
                  {platform}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-bold">Actions: </p>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Button className="h-9 rounded-md px-3 md:h-10 md:px-4 md:py-2">
                Put in backlog
              </Button>
            </li>
            <li>
              <Button className="h-9 rounded-md px-3 md:h-10 md:px-4 md:py-2">
                Start playing
              </Button>
            </li>
            <li>
              <Button className="h-9 rounded-md px-3 md:h-10 md:px-4 md:py-2">
                Complete
              </Button>
            </li>
            <li>
              <Button className="h-9 rounded-md px-3 md:h-10 md:px-4 md:py-2">
                Abandon
              </Button>
            </li>
          </ul>
        </article>
      </div>
    </div>
  )
}
