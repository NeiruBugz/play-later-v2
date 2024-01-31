import { getUserById, hasUsername } from "@/features/auth/actions"
import { UserNameForm } from "@/features/auth/username-form"
import { GameCard } from "@/features/game/ui/game-card"
import { getGames, updateGame } from "@/features/library/actions"
import AddGame from "@/features/library/ui/add-game/add-game"
import { LibraryFiltersWrapper } from "@/features/library/ui/filters/filters"
import { ListWrapper } from "@/features/library/ui/list-wrapper"
import { LibraryNavigation } from "@/features/library/ui/navigation"
import { PickerDialog } from "@/features/library/ui/pick-random-game/picker-dialog"
import { HowLongToBeatService } from "howlongtobeat"

import { getServerUserId } from "@/lib/auth"
import { groupByYear } from "@/lib/utils"

type LibraryPageProps = {
  params: {}
  searchParams: URLSearchParams
}

export default async function LibraryPage(props: LibraryPageProps) {
  const params = new URLSearchParams(props.searchParams)
  const platform = params.get("platform") ?? " "
  const currentStatus = params.get("status")
  const searchQuery = params.get("search") ?? ""

  const withUsername = await hasUsername()

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

  const currentList = () => {
    if (currentStatus === "BACKLOG") {
      return backloggedByYear
    }

    if (currentStatus === "INPROGRESS") {
      return inprogress
    }

    if (currentStatus === "COMPLETED") {
      return completedByYear
    }

    if (currentStatus === "FULL_COMPLETION") {
      return fullCompletionByYear
    }

    if (currentStatus === "ABANDONED") {
      return abandoned
    }

    return []
  }

  const list = currentList()

  return (
    <section className="relative">
      <header className="sticky top-0 z-40 bg-background p-4 md:container">
        <div className="flex flex-wrap justify-between">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Library
          </h1>
          {currentStatus === "BACKLOG" ? (
            <PickerDialog items={backlogged} />
          ) : null}
          <AddGame />
        </div>
        <section>
          <LibraryNavigation />
        </section>
        <section>
          <LibraryFiltersWrapper />
        </section>
      </header>
      <section className="bg-background p-4 md:container">
        <div>
          {currentStatus === "BACKLOG" ? (
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">
                Total backlog time is {totalBacklogTime} hours and includes{" "}
                {backlogged.length} game(s)
              </p>
            </div>
          ) : null}
          <ListWrapper count={backlogged.length}>
            {Array.isArray(list)
              ? list.map((game) => <GameCard key={game.id} game={game} />)
              : [...list.entries()].map(([year, games]) => {
                  return games.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))
                })}
          </ListWrapper>
        </div>
      </section>
      {withUsername ? null : <UserNameForm />}
    </section>
  )
}
