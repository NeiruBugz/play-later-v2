"use client"

import { useState } from "react"
import { ResultsList } from "@/features/search/results-list"
import { Loader2Icon, Search } from "lucide-react"

import { useSearch } from "@/lib/query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SearchForm() {
  const [searchValue, setSearchValue] = useState("")
  const { mutateAsync: search, data: games, isLoading } = useSearch()

  const onSubmit = async () => {
    await search(searchValue)
  }

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
      {!isLoading ? (
        <ResultsList games={games ?? []} />
      ) : (
        <Loader2Icon className="animate-spin" />
      )}
    </>
  )
}
