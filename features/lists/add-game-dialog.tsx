"use client"

import { useMemo, useState } from "react"
import { addGameToList } from "@/features/library/actions"
import { Game, GamePlatform, List } from "@prisma/client"
import { Gamepad2Icon, Plus } from "lucide-react"

import { platformEnumToColor, uppercaseToNormal } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge, ColorVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useToast } from "@/components/ui/use-toast"

function AddGameDialog({ id, games }: { id: List["id"]; games: Game[] }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { toast } = useToast()

  const filtered = useMemo(() => {
    return games.filter((game) =>
      game.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [games, search])

  const showToast = (type: "success" | "error", game: string) => {
    if (type === "success") {
      toast({
        title: "Success",
        description: `${game} was successfully added to list`,
        duration: 2000,
      })
      setOpen(false)
      return
    }

    if (type === "error") {
      toast({
        title: "Oops, something happened",
        description: `We couldn't add ${game} to list`,
        variant: "destructive",
        duration: 2000,
      })
      setOpen(false)
      return
    }
  }

  if (id === "") {
    return
  }

  const onItemClick = async (game: Game) => {
    try {
      await addGameToList({ gameId: game.id, listId: id })
      showToast("success", game.title)
    } catch (error) {
      console.error(error)
      showToast("error", game.title)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="flex size-32 items-center justify-center gap-2 border-2 sm:size-36 md:size-48 xl:size-52"
        onClick={() => setOpen(true)}
      >
        <Plus />
        Add game
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="mx-auto">
          <CommandInput
            placeholder="Search for a game within your library"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList results={filtered.length}>
            <CommandEmpty>No results found.</CommandEmpty>
            {filtered.map((game) => (
              <CommandItem key={`${game.id}`} className="cursor-pointer">
                <div
                  className="flex w-full flex-1 items-center justify-between"
                  onClick={() => onItemClick(game)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="rounded-md">
                      <AvatarImage
                        className="object-cover"
                        src={game.imageUrl}
                        alt={game.title}
                      />
                      <AvatarFallback>
                        <Gamepad2Icon />
                      </AvatarFallback>
                    </Avatar>
                    {game.title}
                  </div>
                  <div className="w-fit">
                    <Badge
                      variant={
                        platformEnumToColor(
                          game.platform as GamePlatform
                        ) as ColorVariant
                      }
                    >
                      {uppercaseToNormal(game.platform as string)}
                    </Badge>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

export { AddGameDialog }
