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
          <Button variant="outline" className="h-full">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          {gameInfo.name}
        </h1>
      </header>
      <div className="mt-6 flex gap-4">
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
          <ul className="flex gap-2">
            {gameInfo.platforms.map((platform) => (
              <li key={nanoid()}>
                <Badge variant={platformEnumToColor(platform)}>
                  {platform}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-2">Actions: </p>
          <ul className="flex gap-2">
            <li>
              <Button>To Backlog</Button>
            </li>
            <li>
              <Button>Start playing</Button>
            </li>
            <li>
              <Button>Complete</Button>
            </li>
            <li>
              <Button>Abandon</Button>
            </li>
          </ul>
        </article>
      </div>
    </div>
  )
}
