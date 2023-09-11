import Image from "next/image"
import Link from "next/link"
import { getGame } from "@/features/library/actions"
import ChangeStatusButton from "@/features/library/ui/change-status-button"
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

  return (
    <div className="pb-4">
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
          className="h-auto w-full md:w-64"
        />
        <article>
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            {prepareDescription(gameInfo.description)}
          </p>
          <p className="my-2 font-bold">Platforms: </p>
          <ul className="flex flex-wrap gap-2">
            {gameInfo.platforms.map((platform) => (
              <li key={nanoid()}>
                <Badge variant={platformEnumToColor(platform)}>
                  {platform}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="my-2 font-bold">Actions: </p>
          <ul className="flex flex-wrap gap-2">
            <li>
              <ChangeStatusButton
                gameStatus={gameInfo.status}
                gameId={params.id}
                buttonStatus="BACKLOG"
              />
            </li>
            <li>
              <ChangeStatusButton
                gameStatus={gameInfo.status}
                gameId={params.id}
                buttonStatus="INPROGRESS"
              />
            </li>
            <li>
              <ChangeStatusButton
                gameStatus={gameInfo.status}
                gameId={params.id}
                buttonStatus="COMPLETED"
              />
            </li>
            <li>
              <ChangeStatusButton
                gameStatus={gameInfo.status}
                gameId={params.id}
                buttonStatus="ABANDONED"
              />
            </li>
          </ul>
        </article>
      </div>
    </div>
  )
}
