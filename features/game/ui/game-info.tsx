import Image from "next/image"
import { GameDeleteDialog } from "@/features/game/ui/game-delete-dialog"
import { GameStatusRadio } from "@/features/game/ui/game-status-radio"
import { GameEntity } from "@/features/library/actions"
import { WishlistEntity } from "@/features/wishlist/actions"
import { GameStatus } from "@prisma/client"
import { nanoid } from "nanoid"

import {
  cn,
  hasSelectedPlatformInList,
  platformEnumToColor,
  prepareDescription,
  uppercaseToNormal,
} from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { RenderWhen } from "@/components/render-when"

export function GameInfo({
  game,
  gameStatus,
}: {
  game: GameEntity | WishlistEntity
  gameStatus?: GameStatus
}) {
  console.log(game.purchaseType, game.platforms)
  return (
    <div className="mt-6 flex flex-col flex-wrap gap-4 md:flex-row">
      <Image
        src={game.imageUrl}
        alt={`${game.name} artwork`}
        width={760}
        height={570}
        priority
        className="h-auto w-full md:w-64"
      />
      <article className="2xl:max-w-[900px]">
        <h1 className="mb-3 scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          {game.name}
        </h1>
        <RenderWhen condition={!!game.purchaseType}>
          <section>
            <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
              Format
            </h3>
            <Badge>{uppercaseToNormal(game.purchaseType as string)}</Badge>
          </section>
        </RenderWhen>
        <RenderWhen condition={game.platforms.length !== 0}>
          <section>
            <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
              Platforms
            </h3>
            <ul className="flex flex-wrap gap-2">
              {game.platforms.map((platform) => (
                <li key={nanoid()}>
                  <Badge
                    variant={platformEnumToColor(platform)}
                    className={cn({
                      bordered: hasSelectedPlatformInList(
                        platform,
                        game.platform as string
                      ),
                    })}
                  >
                    {platform}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        </RenderWhen>
        <section>
          <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
            Description
          </h3>
          <p className="leading-7">{prepareDescription(game.description)}</p>
        </section>
        <section>
          <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
            Actions
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <GameStatusRadio gameStatus={gameStatus} gameId={game.id} />
            <GameDeleteDialog
              id={game.id}
              isWishlist={gameStatus === undefined}
            />
          </div>
        </section>
      </article>
    </div>
  )
}
