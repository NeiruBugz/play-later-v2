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

export function GamePicker({
  selectedGame,
  onGameSelect,
}: {
  onGameSelect: (game: HowLongToBeatEntry) => void
  selectedGame?: string
}) {
  const { data, isLoading, mutateAsync: search, reset } = useSearch()

  React.useEffect(() => {
    return () => reset()
  }, [reset])

  return (
    <Command className="w-full">
      <CommandInput onValueChange={(value) => void search(value)} autoFocus />
      <CommandList>
        {isLoading ? (
          <CommandEmpty className="flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </CommandEmpty>
        ) : null}
        {!data && !isLoading ? (
          <CommandEmpty>Start typing game title</CommandEmpty>
        ) : null}
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
      </CommandList>
    </Command>
  )
}
