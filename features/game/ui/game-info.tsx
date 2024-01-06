import Image from "next/image"
import { GameDeleteDialog } from "@/features/game/ui/game-delete-dialog"
import { GameStatusRadio } from "@/features/game/ui/game-status-radio"
import { GameEntity } from "@/features/library/actions"
import { WishlistEntity } from "@/features/wishlist/actions"
import { GameStatus } from "@prisma/client"
import { format } from "date-fns"
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
    <div className="mt-6 flex flex-col flex-wrap gap-4 md:flex-row">
      <Image
        src={game.imageUrl}
        alt={`${game.name} artwork`}
        fill
        priority
        className="!relative h-auto !w-[400px] rounded-md"
      />
      <article className="2xl:max-w-[900px]">
        <h1 className="mb-3 scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          {game.name}
        </h1>
        <div>
          <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
            Added at
          </h3>
          <p>{format(game.createdAt, "dd MMM, yyyy")}</p>
          <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
            Last updated
          </h3>
          <p>{format(game.updatedAt, "dd MMM, yyyy")}</p>
        </div>
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
              Chosen platform
            </h3>
            {game.platform ? (
              <Badge
                variant={platformEnumToColor(game.platform) as ColorVariant}
                className={cn({
                  bordered: hasSelectedPlatformInList(
                    game.platform,
                    game.platform as string
                  ),
                })}
              >
                {game.platform}
              </Badge>
            ) : null}
            <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
              Other available platforms
            </h3>
            <ul className="flex flex-wrap gap-2">
              {game.platforms.map((platform) =>
                !hasSelectedPlatformInList(
                  platform,
                  game.platform as string
                ) ? (
                  <li key={nanoid()}>
                    <Badge
                      variant={platformEnumToColor(platform) as ColorVariant}
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
                ) : null
              )}
            </ul>
          </section>
        </RenderWhen>
        <section>
          <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
            Beating times
          </h3>
          <section className="flex items-center gap-4 border-y-2">
            <div className="p-2">
              <p className="font-medium leading-7">Main </p>
              <p className="leading-7">{game.gameplayMain} h</p>
            </div>
            <div className="border-x-2 p-2">
              <p className="font-medium leading-7">Main + Extra</p>
              <p className="leading-7">{game.gameplayMainExtra} h</p>
            </div>
            <div className="p-2">
              <p className="font-medium leading-7">Completionist</p>
              <p className="leading-7">{game.gameplayCompletionist} h</p>
            </div>
          </section>
        </section>
      </article>
      <article>
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
