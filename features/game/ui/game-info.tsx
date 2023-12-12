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
import { Badge, ColorVariant } from "@/components/ui/badge"
import { RenderWhen } from "@/components/render-when"

export function GameInfo({
  game,
  gameStatus,
}: {
  game: GameEntity | WishlistEntity
  gameStatus?: GameStatus
}) {
  return (
    <div className="mt-6 flex flex-col flex-wrap justify-center gap-4 md:mx-auto md:flex-row 2xl:max-w-[1200px]">
      <div className="flex h-fit w-full flex-col items-center justify-center gap-4 rounded border p-4 shadow-md md:flex-row md:gap-12 md:px-6 md:py-4 2xl:min-w-[1200px]">
        <Image
          src={game.imageUrl}
          alt={`${game.name} artwork`}
          width={570}
          height={570}
          priority
          className="aspect-square h-auto w-56 rounded object-cover md:w-64"
        />
        <div className="flex flex-col justify-center gap-4">
          <h1 className="my-2 scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
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
          <RenderWhen condition={!!game.platform}>
            <section>
              <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
                Platform of choice
              </h3>
              {game.platform ? (
                <Badge
                  variant={platformEnumToColor(game.platform) as ColorVariant}
                >
                  {uppercaseToNormal(game.platform)}
                </Badge>
              ) : null}
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
                      variant={platformEnumToColor(platform) as ColorVariant}
                    >
                      {platform}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          </RenderWhen>
        </div>
      </div>

      <article className="flex flex-col gap-y-6 w-full">
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
          <div className="flex flex-wrap items-center justify-between gap-2">
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
