import { getGames } from "@/data/games"
import AddGame from "@/features/library/add-game"
import { GameCard } from "@/features/library/game-card"
import { Ghost, Library, ListChecks, Play } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function LibraryPage() {
  const { abandoned, backlogged, completed, inprogress } = await getGames()
  return (
    <Tabs defaultValue="inProgress" className="h-full space-y-6">
      <div className="space-between flex w-full items-center">
        <TabsList>
          <TabsTrigger value="backlog">
            <>
              <Library className="md:mr-1" />
              &nbsp;
              <span className="hidden md:block">Backlog</span>
            </>
          </TabsTrigger>
          <TabsTrigger value="inProgress">
            <>
              <Play className="md:mr-1" />
              <span className="hidden md:block">Playing</span>
            </>
          </TabsTrigger>
          <TabsTrigger value="completed">
            <>
              <ListChecks className="md:mr-1" />
              <span className="hidden md:block">Completed</span>
            </>
          </TabsTrigger>
          <TabsTrigger value="Abandoned">
            <>
              <Ghost className="md:mr-1" />
              <span className="hidden md:block">Abandoned</span>
            </>
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto mr-4">
          <AddGame />
        </div>
      </div>
      <TabsContent value="backlog" className="flex flex-wrap gap-4">
        {backlogged.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </TabsContent>
      <TabsContent value="inProgress" className="flex flex-wrap gap-4">
        {inprogress.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </TabsContent>
      <TabsContent value="completed" className="flex flex-wrap gap-4">
        {completed.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </TabsContent>
      <TabsContent value="abandoned" className="flex flex-wrap gap-4">
        {abandoned.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </TabsContent>
    </Tabs>
  )
}
