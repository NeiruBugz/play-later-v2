import { GameCard } from "@/features/game/ui/game-card"
import { getGames, updateGame } from "@/features/library/actions"
import AddGame from "@/features/library/ui/add-game/add-game"
import { LibraryFilters } from "@/features/library/ui/filters"
import { ListWrapper } from "@/features/library/ui/list-wrapper"
import { LibraryNavigation } from "@/features/library/ui/navigation"
import { PickerDialog } from "@/features/library/ui/pick-random-game/picker-dialog"
import { PlatformFilter } from "@/features/library/ui/platform-filter"
import { HowLongToBeatService } from "howlongtobeat"
import { Ghost, Library, ListChecks, Play } from "lucide-react"

import { groupByYear } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type LibraryPageProps = {
  params: {}
  searchParams: URLSearchParams
}

export default async function LibraryPage(props: LibraryPageProps) {
  const params = new URLSearchParams(props.searchParams)
  const platform = params.get("platform") ?? " "
  const currentStatus = params.get("status")

  const filters = {
    platform,
    order: params.get("order") ?? "asc",
    sortBy: params.get("sortBy") ?? "updatedAt",
  }

  console.log(currentStatus)
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
    <section>
      <div className="flex flex-wrap justify-between">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          Library
        </h1>
        <AddGame />
      </div>
      <section>
        <LibraryNavigation />
      </section>
      <section>
        <LibraryFilters />
      </section>
      <section>
        <div>
          {currentStatus === "BACKLOG" ? (
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">
                Total backlog time is {totalBacklogTime} hours and includes{" "}
                {backlogged.length} game(s)
              </p>
              <PickerDialog items={backlogged} />
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
      {/* <Tabs defaultValue="inProgress" className="mt-4 h-full space-y-6">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="backlog">
              <>
                <Library className="md:mr-1 md:h-4 md:w-4" />
                &nbsp;
                <span className="hidden md:block">Backlog</span>
              </>
            </TabsTrigger>
            <TabsTrigger value="inProgress">
              <>
                <Play className="md:mr-1 md:h-4 md:w-4" />
                <span className="hidden md:block">Playing</span>
              </>
            </TabsTrigger>
            <TabsTrigger value="completed">
              <>
                <ListChecks className="md:mr-1 md:h-4 md:w-4" />
                <span className="hidden md:block">Completed</span>
              </>
            </TabsTrigger>
            <TabsTrigger value="fullCompletion">
              <>
                <ListChecks className="md:mr-1 md:h-4 md:w-4" />
                <span className="hidden md:block">100% Completion</span>
              </>
            </TabsTrigger>
            <TabsTrigger value="abandoned">
              <>
                <Ghost className="md:mr-1 md:h-4 md:w-4" />
                <span className="hidden md:block">Abandoned</span>
              </>
            </TabsTrigger>
          </TabsList>
          <div className="flex justify-between gap-2">
            <PlatformFilter />
            <AddGame />
          </div>
        </div>
        <TabsContent value="backlog">
          <>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">
                Total backlog time is {totalBacklogTime} hours and includes{" "}
                {backlogged.length} game(s)
              </p>
              <PickerDialog items={backlogged} />
            </div>
            {[
              [...backloggedByYear.entries()].map(([year, games]) => {
                return (
                  <div className="mt-2">
                    <h3 className="mb-2 text-xl font-bold">
                      In backlog since {year}
                    </h3>
                    <ListWrapper count={completed.length}>
                      {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                      ))}
                    </ListWrapper>
                  </div>
                )
              }),
            ]}
          </>
        </TabsContent>
        <TabsContent value="inProgress" className="flex flex-wrap gap-4">
          <ListWrapper count={inprogress.length}>
            {inprogress.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </ListWrapper>
        </TabsContent>
        <TabsContent value="completed" className="flex flex-wrap gap-4">
          {[
            [...completedByYear.entries()].map(([year, games]) => {
              return (
                <div>
                  <h3 className="mb-2 text-xl font-bold">
                    Completed in {year}
                  </h3>
                  <ListWrapper count={completed.length}>
                    {games.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </ListWrapper>
                </div>
              )
            }),
          ]}
        </TabsContent>
        <TabsContent value="fullCompletion" className="flex flex-wrap gap-4">
          {[
            [...fullCompletionByYear.entries()].map(([year, games]) => {
              return (
                <div>
                  <h3 className="mb-2 text-xl font-bold">100% in {year}</h3>
                  <ListWrapper count={completed.length}>
                    {games.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </ListWrapper>
                </div>
              )
            }),
          ]}
        </TabsContent>
        <TabsContent value="abandoned" className="flex flex-wrap gap-4">
          <ListWrapper count={abandoned.length}>
            {abandoned.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </ListWrapper>
        </TabsContent>
      </Tabs> */}
    </section>
  )
}
