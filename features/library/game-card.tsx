import Image from "next/image"
import { Game } from "@prisma/client"

export function GameCard({ game }: { game: Game }) {
  return (
    <div className="max-w-24 h-auto">
      <Image
        src={game.imageUrl}
        alt={`${game.title} cover art`}
        className="m-0 h-40 w-48 rounded-sm bg-slate-400/60 object-scale-down sm:h-48 sm:w-48"
        width={256}
        height={256}
      />
      <p className="w-32 gap-6 whitespace-break-spaces font-bold">
        {game.title}
      </p>
    </div>
  )
}
