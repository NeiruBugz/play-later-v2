"use client"

import { useCallback, useEffect, useState } from "react"
import { ResultsList } from "@/features/search/results-list"
import { Loader2Icon, Search } from "lucide-react"

import { useSearch } from "@/lib/query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RenderWhen } from "@/components/render-when"

export function SearchForm() {
  const [searchValue, setSearchValue] = useState("")
  const { mutateAsync: search, data: games, isPending } = useSearch()

  const onSubmit = useCallback(async () => {
    await search(searchValue)
  }, [searchValue, search])

  useEffect(() => {
    const onEnterPress = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        onSubmit()
      }
    }

    document.addEventListener("keydown", onEnterPress)

    return () => {
      document.removeEventListener("keydown", onEnterPress)
    }
  }, [onSubmit])

  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <Input
          name="searchQuery"
          id="searchQuery"
          type="text"
          placeholder="Start typing game name"
          value={searchValue}
          onChange={(event) => setSearchValue(event.currentTarget.value)}
        />
        <Button variant="ghost" className="p-0" onClick={onSubmit}>
          <Search size={14} />
        </Button>
      </div>
      <RenderWhen
        condition={!isPending}
        fallback={<Loader2Icon className="animate-spin" />}
      >
        <ResultsList games={games ?? []} />
      </RenderWhen>
    </>
  )
}
