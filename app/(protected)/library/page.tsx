import { hasUsername } from "@/features/auth/actions"
import { UserNameForm } from "@/features/auth/username-form"
import { GameCard } from "@/features/game/ui/game-card"
import { getGames, updateGame } from "@/features/library/actions"
import AddGame from "@/features/library/ui/add-game/add-game"
import { LibraryFiltersWrapper } from "@/features/library/ui/filters/filters"
import { ListWrapper } from "@/features/library/ui/list-wrapper"
import { LibraryNavigation } from "@/features/library/ui/navigation"
import { PickerDialog } from "@/features/library/ui/pick-random-game/picker-dialog"
import { Game, GameStatus } from "@prisma/client"
import { HowLongToBeatService } from "howlongtobeat"

import { groupByYear } from "@/lib/utils"

type LibraryPageProps = {
  params: {}
  searchParams: URLSearchParams
}

type GamesByYear = Map<number, Game[]>

type LibraryData = {
  list: Game[] | GamesByYear
  currentStatus: string
  totalBacklogTime: number
  backlogged: Game[]
}

type LibraryHeaderProps = {
  currentStatus: string
  backlogged: Game[]
}

type LibraryContentProps = {
  list: Game[] | GamesByYear
  currentStatus: string
  totalBacklogTime: number
  backloggedLength: number
}

async function fetchAndProcessGames(
  params: URLSearchParams
): Promise<LibraryData> {
  const platform = params.get("platform") ?? " "
  const currentStatus = (params.get("status") as GameStatus) ?? "BACKLOG"
  const searchQuery = params.get("search") ?? ""

  const filters = {
    platform,
    order: params.get("order") ?? "asc",
    sortBy: params.get("sortBy") ?? "updatedAt",
    search: searchQuery,
  }

  const { abandoned, backlogged, completed, inprogress, fullCompletion } =
    await getGames(filters)

  for (const game of backlogged) {
    if (!game.gameplayTime && game.howLongToBeatId) {
      const hltbService = new HowLongToBeatService()
      const details = await hltbService.detail(game.howLongToBeatId)
      await updateGame(
        game.id,
        "gameplayTime",
        details?.gameplayMain,
        game.updatedAt
      )
    }
  }

  const totalBacklogTime = backlogged.reduce(
    (acc, game) => acc + (game.gameplayTime ? game.gameplayTime : 0),
    0
  )

  const completedByYear = groupByYear(completed)
  const fullCompletionByYear = groupByYear(fullCompletion)
  const backloggedByYear = groupByYear(backlogged)

  const currentList = (): Game[] | GamesByYear => {
    if (currentStatus === "INPROGRESS") {
      return inprogress
    }

    if (currentStatus === "ABANDONED") {
      return abandoned
    }

    if (currentStatus === "BACKLOG") {
      return backloggedByYear
    }

    if (currentStatus === "COMPLETED") {
      return completedByYear
    }

    if (currentStatus === "FULL_COMPLETION") {
      return fullCompletionByYear
    }

    return []
  }

  const list = currentList()

  return {
    list,
    currentStatus,
    totalBacklogTime,
    backlogged,
  }
}

function LibaryHeader({ currentStatus, backlogged }: LibraryHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background p-4 md:container">
      <div className="flex flex-wrap justify-between">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          Library
        </h1>
      </div>
      <section className="mt-4 flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <LibraryNavigation />
          <LibraryFiltersWrapper />
        </div>
        {currentStatus === "BACKLOG" && backlogged.length !== 0 ? (
          <PickerDialog items={backlogged} />
        ) : null}
      </section>
    </header>
  )
}

function LibraryContent({
  currentStatus,
  totalBacklogTime,
  backloggedLength,
  list,
}: LibraryContentProps) {
  if (Array.isArray(list)) {
    return (
      <div>
        {currentStatus === "BACKLOG" ? (
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold">
              Total backlog time is {totalBacklogTime} hours and includes{" "}
              {backloggedLength} game(s)
            </p>
          </div>
        ) : null}
        <ListWrapper count={backloggedLength}>
          {list.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </ListWrapper>
      </div>
    )
  }

  return (
    <div>
      {currentStatus === "BACKLOG" ? (
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold">
            Total backlog time is {totalBacklogTime} hours and includes{" "}
            {backloggedLength} game(s)
          </p>
        </div>
      ) : null}
      <ListWrapper count={backloggedLength}>
        {[...list.entries()].map(([year, games]) => {
          return games.map((game) => <GameCard key={game.id} game={game} />)
        })}
      </ListWrapper>
    </div>
  )
}

function setDefaultProps() {
  const params = new URLSearchParams(window.location.search)
  if (!params.get("sort")) {
    params.set("sort", "updatedAt")
    params.set("order", "desc")
  }

  return params
}

export default async function LibraryPage({
  searchParams = setDefaultProps(),
}: LibraryPageProps) {
  const params = new URLSearchParams(searchParams)
  const { list, currentStatus, totalBacklogTime, backlogged } =
    await fetchAndProcessGames(params)
  const withUsername = await hasUsername()

  return (
    <section className="relative">
      <LibaryHeader currentStatus={currentStatus} backlogged={backlogged} />
      <section className="bg-background p-4 md:container">
        <LibraryContent
          list={list}
          currentStatus={currentStatus}
          totalBacklogTime={totalBacklogTime}
          backloggedLength={backlogged.length}
        />
      </section>
      {withUsername ? null : <UserNameForm />}
    </section>
  )
}
