"use client"

import { ChangeEvent, useState } from "react"
import { createList } from "@/features/lists"
import { Game } from "@prisma/client"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function CreateList({ randomGames }: { randomGames: Game[] }) {
  const [listName, setListName] = useState("")
  const [gamesToAdd, setGamesToAdd] = useState<Map<Game["id"], Game>>(new Map())
  const [open, setOpen] = useState(false)

  const onNameChange = ({
    currentTarget: { value },
  }: ChangeEvent<HTMLInputElement>) => {
    setListName(value)
  }

  const onCreate = async () => {
    try {
      const games = [...gamesToAdd.values()]
      await createList({ name: listName, games })
      setListName("")
      setOpen(false)
    } catch (error) {
      console.error(error)
    }
  }

  const addGameToList = (game: Game) => {
    setGamesToAdd((prev) => {
      const newMap = new Map(prev)
      if (newMap.has(game.id)) {
        newMap.delete(game.id)
      } else {
        newMap.set(game.id, game)
      }

      return newMap
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit gap-2">
          <Plus />
          Create list
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create custom list</DialogTitle>
          <DialogDescription>
            Create your unique list of games and share it to others
          </DialogDescription>
          <div className="py-4">
            <Label>
              <span>List name</span>
              <Input type="text" value={listName} onChange={onNameChange} />
            </Label>
            <Label className="mt-2 block">
              You can add initial games for this list
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {randomGames.map((game) => (
                <Badge
                  key={game.id}
                  className={cn(
                    "cursor-pointer border-transparent bg-secondary text-secondary-foreground transition-all duration-300 hover:border-primary hover:bg-transparent hover:text-black",
                    {
                      "bg-primary text-primary-foreground": gamesToAdd.has(
                        game.id
                      ),
                    }
                  )}
                  onClick={() => addGameToList(game)}
                >
                  {game.title}
                </Badge>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onCreate}>Create list</Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export { CreateList }
