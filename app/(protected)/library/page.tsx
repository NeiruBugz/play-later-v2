import { GameCard } from "@/features/game/ui/game-card"
import { getGames } from "@/features/library/actions"
import AddGame from "@/features/library/ui/add-game/add-game"
import { ListWrapper } from "@/features/library/ui/list-wrapper"
import { PickerDialog } from "@/features/library/ui/pick-random-game/picker-dialog"
import { PlatformFilter } from "@/features/library/ui/platform-filter"
import { Ghost, Library, ListChecks, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type LibraryPageProps = {
  params: {}
  searchParams: URLSearchParams
}

export default async function LibraryPage(props: LibraryPageProps) {
  const filter = new URLSearchParams(props.searchParams).get("platform") ?? " "
  const { abandoned, backlogged, completed, inprogress, fullCompletion } =
    await getGames(filter)
  return (
    <section>
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
        Library
      </h1>
      <Tabs defaultValue="inProgress" className="mt-4 h-full space-y-6">
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
            <PickerDialog items={backlogged} />
            <ListWrapper>
              {backlogged.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </ListWrapper>
          </>
        </TabsContent>
        <TabsContent value="inProgress" className="flex flex-wrap gap-4">
          <ListWrapper>
            {inprogress.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </ListWrapper>
        </TabsContent>
        <TabsContent value="completed" className="flex flex-wrap gap-4">
          <ListWrapper>
            {completed.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </ListWrapper>
        </TabsContent>
        <TabsContent value="fullCompletion" className="flex flex-wrap gap-4">
          <ListWrapper>
            {fullCompletion.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </ListWrapper>
        </TabsContent>
        <TabsContent value="abandoned" className="flex flex-wrap gap-4">
          <ListWrapper>
            {abandoned.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </ListWrapper>
        </TabsContent>
      </Tabs>
    </section>
  )
}
