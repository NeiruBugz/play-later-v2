import Image from "next/image"
import { games } from "@/data/games"
import { PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"

const completed = games.filter((game) => game.status === "completed")
const inprogress = games.filter((game) => game.status === "inprogress")

export default function LibraryPage() {
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
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add game
                </Button>
              </div>
            </div>
            <TabsContent value="inProgress">
              {inprogress.map((game) => (
                <div key={game.id} className="space-y-3">
                  <div className="overflow-hidden rounded-md">
                    <Image
                      src={game.imageUrl}
                      alt={game.title}
                      width={250}
                      height={330}
                      className={cn(
                        "aspect-[3/4] h-auto w-[250px] object-cover transition-all hover:scale-105"
                      )}
                    />
                  </div>
                  <div className="space-y-1 text-sm">
                    <h3 className="font-medium leading-none">{game.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {game.platform}
                    </p>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="completed">
              {completed.map((game) => (
                <div key={game.id} className="space-y-3">
                  <div className="overflow-hidden rounded-md">
                    <Image
                      src={game.imageUrl}
                      alt={game.title}
                      width={250}
                      height={330}
                      className={cn(
                        "aspect-[3/4] h-auto w-[250px] object-cover transition-all hover:scale-105"
                      )}
                    />
                  </div>
                  <div className="space-y-1 text-sm">
                    <h3 className="font-medium leading-none">{game.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {game.platform}
                    </p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
