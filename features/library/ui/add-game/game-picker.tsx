"use client"

import React from "react"
import { HowLongToBeatEntry } from "howlongtobeat"
import { Loader2 } from "lucide-react"

import { useSearch } from "@/lib/query"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function GamePicker({
  onGameSelect,
}: {
  onGameSelect: (game: HowLongToBeatEntry) => void
}) {
  const { data, isLoading, mutateAsync: search, reset } = useSearch()

  React.useEffect(() => {
    return () => reset()
  }, [reset])

  return (
    <Command className="min-w-[360px]">
      <CommandInput onValueChange={(value) => void search(value)} />
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
            className="cursor-pointer"
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
