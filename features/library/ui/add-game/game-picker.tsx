"use client"

import React from "react"
import { HowLongToBeatEntry } from "howlongtobeat"
import { Loader2 } from "lucide-react"

import { useSearch } from "@/lib/query"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { RenderWhen } from "@/components/render-when"

export function GamePicker({
  selectedGame,
  onGameSelect,
  width,
}: {
  onGameSelect: (game: HowLongToBeatEntry) => void
  selectedGame?: string
  width?: number
}) {
  const { data, isPending, mutateAsync: search, reset } = useSearch()
  console.log(width)

  React.useEffect(() => {
    return () => reset()
  }, [reset])

  return (
    <Command className="w-full" style={{ width: width }}>
      <CommandInput onValueChange={(value) => void search(value)} autoFocus />
      <CommandList>
        <RenderWhen condition={isPending}>
          <CommandEmpty className="flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </CommandEmpty>
        </RenderWhen>
        <RenderWhen condition={Boolean(data) && data?.length !== 0}>
          {data?.map((result) => (
            <CommandItem
              className={cn("cursor-pointer last-of-type:rounded-sm", {
                "font-bold": selectedGame === result.id,
              })}
              key={result.id}
              value={`${result.name}_${result.id}`}
              onSelect={() => onGameSelect(result)}
            >
              <div className="flex gap-2 items-center">
                <Avatar className="rounded-md">
                  <AvatarImage
                    className="object-cover"
                    src={result.imageUrl}
                    alt={result.name}
                  />
                  <AvatarFallback>{result.name}</AvatarFallback>
                </Avatar>
                {result.name}
              </div>
            </CommandItem>
          ))}
        </RenderWhen>
      </CommandList>
    </Command>
  )
}
