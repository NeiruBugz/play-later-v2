"use client"

import React from "react"
import { HowLongToBeatEntry } from "howlongtobeat"
import { Loader2 } from "lucide-react"

import { useSearch } from "@/lib/query"
import { cn } from "@/lib/utils"
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
}: {
  onGameSelect: (game: HowLongToBeatEntry) => void
  selectedGame?: string
}) {
  const { data, isPending, mutateAsync: search, reset } = useSearch()

  React.useEffect(() => {
    return () => reset()
  }, [reset])

  return (
    <Command className="w-full">
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
              className={cn("cursor-pointer", {
                "font-bold": selectedGame === result.id,
              })}
              key={result.id}
              onSelect={() => onGameSelect(result)}
            >
              {result.name}
            </CommandItem>
          ))}
        </RenderWhen>
      </CommandList>
    </Command>
  )
}
