import getGames from "@/data/games"
import AddGame from "@/features/library/add-game"
import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"

export default async function LibraryPage() {
  const { backlogged, completed, inprogress, abandoned } = await getGames()
  return (
    <>
      <SiteHeader />
      <main className="container bg-background">
        <div className="h-full py-6">
          <Tabs defaultValue="backlog" className="h-full space-y-6">
            <div className="space-between flex w-full items-center">
              <TabsList>
                <TabsTrigger value="backlog">Backlog</TabsTrigger>
                <TabsTrigger value="inProgress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="Abandoned">Abandoned</TabsTrigger>
              </TabsList>
              <div className="ml-auto mr-4">
                <AddGame />
              </div>
            </div>
            <TabsContent value="backlog">
              {backlogged.map((game) => game.title)}
            </TabsContent>
            <TabsContent value="inProgress">
              {inprogress.map((game) => game.title)}
            </TabsContent>
            <TabsContent value="completed">
              {completed.map((game) => game.title)}
            </TabsContent>
            <TabsContent value="abandoned">
              {abandoned.map((game) => game.title)}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
