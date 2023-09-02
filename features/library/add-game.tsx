"use client"

import { PlusCircle } from "lucide-react"

import { useSearch } from "@/lib/query"
import { Button } from "@/components/ui/button"

export default function AddGame() {
  const { mutateAsync: search, data } = useSearch()
  return (
    <Button onClick={() => search("zelda")}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add game
    </Button>
  )
}
