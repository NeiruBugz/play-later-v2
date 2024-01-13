import Link from "next/link"
import { GameInfo } from "@/features/game/ui/game-info"
import { getGame } from "@/features/library/actions"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

export default async function GamePage({ params }: { params: { id: string } }) {
  const gameInfo = await getGame(params.id)
  console.log(gameInfo)

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
      </header>
      <GameInfo game={gameInfo} gameStatus={gameInfo.status} />
    </div>
  )
}
